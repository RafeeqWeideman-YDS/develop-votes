import { FC, useContext, useEffect } from 'react';
import Image from 'next/image';
import axios from 'axios';

import styles from './ValidatorListItem.module.scss';
import { WalletContext } from '@contexts/wallet';
import { getDisplayDenomFromDenom } from '@utils/currency';
import { VALIDATOR } from 'types/validators';

type ValidatorListItemProps = {
	validator: VALIDATOR;
	onClick?: (validator: VALIDATOR) => () => void;
};

const fetchValidatorAvatar = async (identity: string, onComplete: (url: string) => void): Promise<void> => {
	try {
		const response = await axios.post('/api/validators/getValidatorAvatar', { identity });
		const { url } = response.data;
		if (url) onComplete(url);
	} catch (error) {
		console.error(error);
	}
};

const ValidatorListItem: FC<ValidatorListItemProps> = ({ validator, onClick }) => {
	const delegated = !!validator?.delegation?.shares;
	const denom = getDisplayDenomFromDenom(validator?.delegation?.balance?.denom || '');

	const { updateValidatorAvatar } = useContext(WalletContext);

	useEffect(() => {
		if (validator?.identity && typeof validator.avatarUrl !== 'string')
			fetchValidatorAvatar(validator.identity, (url) => updateValidatorAvatar(validator.address, url));
	}, []);

	if (!validator?.address) {
		return null;
	}

	return (
		<div
			key={validator.address}
			className={`${styles.validatorWrapper} ${onClick && styles.clickable} ${
				delegated ? styles.delegatedValidator : ''
			}`}
			onClick={onClick ? onClick(validator) : () => {}}
		>
			<div className={styles.row}>
				<div className={styles.validatorRank}>{validator.votingRank}</div>
				<div className={styles.validatorAvatar}>
					{!!validator.avatarUrl && (
						<Image src={validator.avatarUrl} alt={`${validator.moniker} avatar`} layout="fill" objectFit="contain" />
					)}
				</div>
				<div className={styles.validatorMoniker}>{validator.moniker} </div>
				<div className={styles.validatorCommission}>{validator.commission}%</div>
			</div>
			{delegated && (
				<div className={styles.row}>
					<div className={styles.validatorText}>My stake:</div>
					<div className={styles.validatorText}>
						{Number(validator.delegation?.balance?.amount ?? 0) / Math.pow(10, 6)} {denom}
					</div>
				</div>
			)}
		</div>
	);
};

export default ValidatorListItem;
