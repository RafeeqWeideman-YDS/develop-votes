import { createSigningClient, SigningStargateClient, cosmos } from '@ixo/impactxclient-sdk';
import { assertIsDeliverTxSuccess } from '@cosmjs/stargate';

import { BLOCKCHAIN_RPC_URL } from '@constants/chains';
import { TRX_FEE, TRX_FEE_OPTION, TRX_FEE_OPTIONS, TRX_MSG } from 'types/transactions';
import { EncodeObject } from '@cosmjs/proto-signing';

export const initStargateClient = async (offlineSigner: any, endpoint?: string): Promise<SigningStargateClient> => {
	const cosmJS = await createSigningClient(endpoint || BLOCKCHAIN_RPC_URL, offlineSigner);
	return cosmJS;
};

export const calculateGasOptions = (gasUsed: number): TRX_FEE_OPTIONS => {
	const gasPriceStep = {
		low: 0.010001,
		average: 0.025003,
		high: 0.030003,
	};
	const gas = gasUsed < 0.01 ? 0.01 : gasUsed;
	const gasOptions = {
		low: gas * gasPriceStep.low,
		average: gas * gasPriceStep.average,
		high: gas * gasPriceStep.high,
	};

	return gasOptions;
};

export const sendTransaction = async (
	client: SigningStargateClient,
	delegatorAddress: string,
	payload: {
		msgs: TRX_MSG[];
		chain_id: string;
		memo: string;
		fee: TRX_FEE_OPTION;
	},
): Promise<any> => {
	// console.log({ client, delegatorAddress, payload });
	try {
		const gasUsed = await client.simulate(delegatorAddress, payload.msgs as EncodeObject[], payload.memo);
		console.log({ gasUsed });
		const gas = gasUsed * 1.3;
		const gasOptions = calculateGasOptions(gas);
		console.log('gasOptions', gasOptions);
		const fee: TRX_FEE = {
			amount: [
				{
					denom: 'uixo',
					amount: String(Math.round(gasOptions[payload.fee || 'average'])),
				},
			],
			gas: String(Math.round(gas)),
		};
		console.log('fee', fee);
		const result = await client.signAndBroadcast(delegatorAddress, payload.msgs as any, fee, payload.memo);
		assertIsDeliverTxSuccess(result);
		return result;
	} catch (e) {
		console.error('sendTransaction', e);
		throw e;
	}
};
