import { Buffer } from "buffer";

export const fromHex = (hex) => Buffer.from(hex, "hex");

// async load() {
//     await Loader.load();
//     const p = await this.blockfrostRequest(`/epochs/latest/parameters`);

//     this.protocolParameters = {
//       linearFee: {
//         minFeeA: p.min_fee_a.toString(),
//         minFeeB: p.min_fee_b.toString(),
//       },
//       minUtxo: "1000000",
//       poolDeposit: "500000000",
//       keyDeposit: "2000000",
//       maxValSize: "5000",
//       maxTxSize: 16384,
//       priceMem: 5.77e-2,
//       priceStep: 7.21e-5,
//     };

//     this.hopperContractInfo = {
//       policy:
//         "a53096f46350b8555bb9d36b403875805029180a56bd667b6c08d0fb"
//     };

//     this.ramanujamContractInfo = {
//       policy:
//         "0c8f4228d02dfaa4e2dcc33a87e25db30f34d238268f6ad57709db1c"
//     };


// }




// // /**
// // *@private
// // */
// // async initTx() {
// //     const txBuilder = Loader.Cardano.TransactionBuilder.new(
// //         Loader.Cardano.LinearFee.new(
// //         Loader.Cardano.BigNum.from_str(
// //             this.protocolParameters.linearFee.minFeeA
// //         ),
// //         Loader.Cardano.BigNum.from_str(
// //             this.protocolParameters.linearFee.minFeeB
// //         )
// //         ),
// //         Loader.Cardano.BigNum.from_str(this.protocolParameters.minUtxo),
// //         Loader.Cardano.BigNum.from_str(this.protocolParameters.poolDeposit),
// //         Loader.Cardano.BigNum.from_str(this.protocolParameters.keyDeposit),
// //         this.protocolParameters.maxValSize,
// //         this.protocolParameters.maxTxSize,
// //         this.protocolParameters.priceMem,
// //         this.protocolParameters.priceStep,
// //         Loader.Cardano.LanguageViews.new(Buffer.from(languageViews, "hex"))
// //     );
// //     const datums = Loader.Cardano.PlutusList.new();
// //     const metadata = { [DATUM_LABEL]: {}, [ADDRESS_LABEL]: {} };
// //     const outputs = Loader.Cardano.TransactionOutputs.new();
// //     return { txBuilder, datums, metadata, outputs };
// // }



// //  /**
// //    * @private
// //    */
// // createOutput(
// //     address,
// //     value,
// // ) {
// //     const v = value;
// //     const minAda = Loader.Cardano.min_ada_required(
// //                         v,
// //                         false,
// //                         Loader.Cardano.BigNum.from_str(this.protocolParameters.minUtxo)
// //                     );
// //     const output = Loader.Cardano.TransactionOutput.new(address, v);
// //     return output;
// // }



// export async function send() {


// //   const { txBuilder, datums, metadata, outputs } = await this.initTx();

//   const walletAddress = Loader.Cardano.BaseAddress.from_address(
//     Loader.Cardano.Address.from_bytes(
//       fromHex((await window.cardano.getUsedAddresses())[0])
//     )
//   );

//   const utxos = (await window.cardano.getUtxos()).map((utxo) =>
//     Loader.Cardano.TransactionUnspentOutput.from_bytes(fromHex(utxo))
//   );
// }



// //   const value = bidUtxo.utxo.output().amount();
// //   outputs.add(
// //     this.createOutput(
// //       CONTRACT_ADDRESS(),
// //       assetsToValue([
// //         {
// //           unit:
// //             this.contractInfo.policyBid +
// //             fromAscii(this.contractInfo.prefixSpaceBudBid + budId),
// //           quantity: "1",
// //         },
// //       ])
// //     )
// //   );
// //   this.splitAmount(value.coin(), walletAddress.to_address(), outputs);
// //   outputs.add(
// //     this.createOutput(
// //       bidUtxo.tradeOwnerAddress,
// //       assetsToValue([
// //         {
// //           unit:
// //             this.contractInfo.policySpaceBudz +
// //             fromAscii(this.contractInfo.prefixSpaceBud + budId),
// //           quantity: "1",
// //         },
// //       ])
// //     )
// //   ); // bidder receiving SpaceBud

// //   const requiredSigners = Loader.Cardano.Ed25519KeyHashes.new();
// //   requiredSigners.add(walletAddress.payment_cred().to_keyhash());
// //   txBuilder.set_required_signers(requiredSigners);

// //   const txHash = await this.finalizeTx({
// //     txBuilder,
// //     changeAddress: walletAddress,
// //     utxos,
// //     outputs,
// //     datums,
// //     metadata,
// //     scriptUtxo: bidUtxo.utxo,
// //     action: SELL,
// //   });
// //   return txHash;
// }
