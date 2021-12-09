import { useState, useEffect } from "react";
import logo from "./layrbridge.png";
import { fromHex } from "./core";
import "./App.css";
import Web3 from 'web3';
import { abi, L2BRIDGE_ADDR } from './abi/BridgeERC20_Factory.json'
import detectEthereumProvider from '@metamask/detect-provider';
import { Navbar, Tab, Tabs, Container, Col, Row, InputGroup, FormControl, DropdownButton, Dropdown, Button, ButtonGroup } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import $ from 'jquery';
import 'bootstrap/dist/js/bootstrap.min.js';

const toHex = (bytes) => Buffer.from(bytes).toString("hex");

// policy ID of RAMANUJAM token on Cardano
const RAMANUJAM_POLICY_ID = "0c8f4228d02dfaa4e2dcc33a87e25db30f34d238268f6ad57709db1c"
// policy ID of HOPPER token on Cardano
const HOPPER_POLICY_ID = "a53096f46350b8555bb9d36b403875805029180a56bd667b6c08d0fb"
// fee to be paid
const FEE = "1000000"
// address of bridge contract to AceLayr at Cardano
const BRIDGE_TO_ACELAYR_CONTRACT_ADDR = "addr_test1wz5ce5hlekf822efjt4w3j24fgx89e3umldrq93hjvuqxssjt4ss8"
// address of HOPPER token at L2
const HOPPER_CONTRACT_ADDR = "0xF73d1653B96c69fCC5eb12a00De9551D29DDE68c"
// address of RAMANUJAM token at L2
const RAMANUJAM_CONTRACT_ADDR = "0x3dCB75C0529F3B19501BD0a3b27D129660bb0b95"

function App() {
  const [wasm, setWasm] = useState(null);
  const [address, setAddress] = useState("");
  const [utxos, setUtxos] = useState([]);
  const [bridgeHopper, setBridgeHopperAmount] = useState("");
  const [bridgeRamanujam, setBridgeRamanujamAmount] = useState("");
  const [bridgeAda, setBridgeAdaAmount] = useState("");
  const [addrAL, setAddrAceLayr] = useState("");
  const [networkParams, setNetworkParam] = useState("");


  const [web3, setWeb3] = useState(null);
  const [l2BridgeContract, setL2BridgeContract] = useState("");
  const [l2SenderAddress, setL2SenderAddress] = useState("");
  const [cardanoReceiverAddress, setCardanoReceiverAddress] = useState("");
  const [withdrawalTokenName, setWithdrawalTokenName] = useState("");
  const [withdrawalTokenAmt, setWithdrawalTokenAmt] = useState("");

  const [deposit, setDeposit] = useState(true)
  const [bridgeToken, setBridgeToken] = useState(0)

  window.addEventListener('load', function () {
    if (typeof window.ethereum == 'undefined') {
      console.log("Please install Metamask");
    } else {
      var newWeb3 = new Web3(window.ethereum)
      setWeb3(newWeb3);
      setL2BridgeContract(new newWeb3.eth.Contract(abi, L2BRIDGE_ADDR));
    }
  });


  useEffect(() => {
    async function start() {
      const tempNetworkParams = await (
        await fetch("https://cardano-testnet.blockfrost.io/api/v0/epochs/latest/parameters", { headers: { project_id: "testnetJrXN1L1NZfh5ktWDsJIRTAu8DyeqDJ7v" } }
        )).json()
      setNetworkParam(tempNetworkParams)

      const tempWasm = await import('@emurgo/cardano-serialization-lib-browser')
      setWasm(tempWasm);
      try {
        try {
          await window.cardano.enable();
          var serializedAddress = (await window.cardano.getUsedAddresses())[0];
          const walletAddress = tempWasm.BaseAddress.from_address(
            tempWasm.Address.from_bytes(fromHex(serializedAddress))
          );
          setAddress(walletAddress)
        } catch (e) {
          alert(e.toString());
        }
      } catch (e) {
        console.log("please connect")
      }
    }
    start();
  }, []);





  // @info connects with the Nami wallet
  async function connectnami() {
    try {
      await window.cardano.enable();
      var serializedAddress = (await window.cardano.getUsedAddresses())[0];
      const walletAddress = wasm.BaseAddress.from_address(
        wasm.Address.from_bytes(fromHex(serializedAddress))
      );
      setAddress(walletAddress)
    } catch (e) {
      alert(e.toString());
    }
  }




  // @info for bridging tokens specified by the user in the UI
  async function bridgeTokens() {
    try {
      await window.cardano.enable();
      var serializedUtxoList = (await window.cardano.getUtxos());
      const tempUtxos = serializedUtxoList.map((utxo) =>
        wasm.TransactionUnspentOutput.from_bytes(fromHex(utxo))
      );
      setUtxos(tempUtxos)


      // collecting all UTXOs at the wallet containing RAMANUJAM and HOPPER
      var multiAssetUtxoInput = tempUtxos.filter(e => {
        if (e.output().amount().multiasset() == undefined) return false
        var scripthash = e.output().amount().multiasset().keys().get(0)
        var decoder = new TextDecoder()
        var tokenname = decoder.decode(e.output().amount().multiasset().get(scripthash).keys().get(0).name())
        return (tokenname == 'RAMANUJAM' || tokenname == 'HOPPER')
      })

      // collecting all UTXOs at the wallet containing ADA
      var adaUtxoInput = tempUtxos.filter(e => {
        if (e.output().amount().multiasset() == undefined) return true
      })


      // creating and sending transaction
      createTx(multiAssetUtxoInput, adaUtxoInput)

    } catch (e) {
      alert(e.toString());
    }
  }


  // @info for constructing and sending transaction
  // @params multiAssetUtxoInput - UTXOs containing assets other than ADA
  // @params adaUtxoInput - UTXOs containing ADA 
  async function createTx(multiAssetUtxoInput, adaUtxoInput) {

    // @todo hardcoded the numbers, some issue with blockfrost API
    //       need to update it to use the API later 
    const txBuilder = wasm.TransactionBuilder.new(
      wasm.LinearFee.new(
        wasm.BigNum.from_str('44'),
        wasm.BigNum.from_str('155381')
      ),
      wasm.BigNum.from_str('34482'),
      wasm.BigNum.from_str('500000000'),
      wasm.BigNum.from_str('2000000'),
      5000,
      16384,
      0.0577,
      0.0000721
    );



    // constructing the input UTXOs
    // getting total input ADA
    var inputAda = wasm.BigNum.from_str("0")
    multiAssetUtxoInput.forEach(e =>
      inputAda = inputAda.checked_add(wasm.BigNum.from_str(e.output().amount().coin().to_str()))
    );
    adaUtxoInput.forEach(e =>
      inputAda = inputAda.checked_add(wasm.BigNum.from_str(e.output().amount().coin().to_str()))
    );

    // getting total for each of the multiassets other than ADA
    var inputRamanujam = wasm.BigNum.from_str("0")
    var inputHopper = wasm.BigNum.from_str("0")
    multiAssetUtxoInput.forEach(e => {
      for (let i = 0; i < e.output().amount().multiasset().keys().len(); i++) {
        var policy = e.output().amount().multiasset().keys().get(i)
        var tokenname = e.output().amount().multiasset().get(policy).keys().get(0)
        var decoder = new TextDecoder()

        // getting total Ramanujam
        if ((equal(policy.to_bytes(), wasm.ScriptHash.from_bytes(Buffer.from(RAMANUJAM_POLICY_ID, "hex")).to_bytes()) == true) &&
          (decoder.decode(tokenname.name()) == 'RAMANUJAM')
        ) {
          inputRamanujam = inputRamanujam.checked_add(wasm.BigNum.from_str(e.output().amount().multiasset().get(policy).get(tokenname).to_str()))
        }

        // getting total Hopper
        if ((equal(policy.to_bytes(), wasm.ScriptHash.from_bytes(Buffer.from(HOPPER_POLICY_ID, "hex")).to_bytes()) == true) &&
          (decoder.decode(tokenname.name()) == 'HOPPER')
        ) {
          inputHopper = inputHopper.checked_add(wasm.BigNum.from_str(e.output().amount().multiasset().get(policy).get(tokenname).to_str()))
        }
      }
    });

    // adding input UTXOs containing ADA
    adaUtxoInput.forEach((utxo) => {
      txBuilder.add_input(
        utxo.output().address(),
        utxo.input(),
        utxo.output().amount()
      );
    });
    // adding input UTXOs containing assets other than ADA
    multiAssetUtxoInput.forEach((utxo) => {
      txBuilder.add_input(
        utxo.output().address(),
        utxo.input(),
        utxo.output().amount()
      );
    });



    // constructing the output UTXOs
    const outputs = wasm.TransactionOutputs.new()
    // check bridged ADA + fee is less than input ADA
    // check bridged RAMANUJAM is less than input RAMANUJAM
    // check bridged HOPPER is less than inout HOPPER
    if (
      inputAda < wasm.BigNum.from_str(bridgeAda).checked_add(wasm.BigNum.from_str(FEE)) &&
      inputRamanujam < wasm.BigNum.from_str(bridgeRamanujam) &&
      inputHopper < wasm.BigNum.from_str(bridgeHopper)
    ) {
      return
    }



    // determining remaining ADA
    const outputAda = inputAda.checked_sub(wasm.BigNum.from_str(bridgeAda).checked_add(wasm.BigNum.from_str(FEE)))
    // determining remaining RAMANUJAM
    const remainingRamanujam = inputRamanujam.checked_sub(wasm.BigNum.from_str(bridgeRamanujam))
    // determining remaining HOPPER
    const remainingHopper = inputHopper.checked_sub(wasm.BigNum.from_str(bridgeHopper))



    // creating assets for sending to the bridge contract on Cardano
    var assetToBridge;
    if ((wasm.BigNum.from_str(bridgeRamanujam) == wasm.BigNum.from_str("0")) &&
      (wasm.BigNum.from_str(bridgeHopper) == wasm.BigNum.from_str("0"))) {
      // bridge only ADA   
      assetToBridge = [
        { unit: "lovelace", quantity: bridgeAda }
      ]
    } else if (wasm.BigNum.from_str(bridgeRamanujam) == wasm.BigNum.from_str("0")) {
      // bridge only ADA and HOPPER
      assetToBridge = [
        { unit: "lovelace", quantity: bridgeAda },
        { unit: HOPPER_POLICY_ID + "HOPPER", quantity: bridgeHopper }
      ]
    } else if (wasm.BigNum.from_str(bridgeHopper) == wasm.BigNum.from_str("0")) {
      // bridge only ADA and RAMANUJAM
      assetToBridge = [
        { unit: "lovelace", quantity: bridgeAda },
        { unit: RAMANUJAM_POLICY_ID + "RAMANUJAM", quantity: bridgeRamanujam }
      ]
    } else {
      // bridge ADA, RAMANUJAM and HOPPER
      assetToBridge = [
        { unit: "lovelace", quantity: bridgeAda },
        { unit: RAMANUJAM_POLICY_ID + "RAMANUJAM", quantity: bridgeRamanujam },
        { unit: HOPPER_POLICY_ID + "HOPPER", quantity: bridgeHopper },
      ]
    }
    // create output UTXOs to bridge contract
    const output = wasm.TransactionOutput.new(wasm.Address.from_bech32(BRIDGE_TO_ACELAYR_CONTRACT_ADDR), assetsToValue(assetToBridge));
    output.set_data_hash(wasm.DataHash.from_bytes(Buffer.from("923918e403bf43c34b4ef6b48eb2ee04babed17320d8d1b9ff9ad086e86f44ec", "hex")))
    outputs.add(output);





    // create output UTXOs for sending the remaining Ada, Ramanujam and Hopper to self
    outputs.add(
      wasm.TransactionOutput.new(
        address.to_address(),
        assetsToValue([
          { unit: "lovelace", quantity: outputAda.to_str() },
          { unit: RAMANUJAM_POLICY_ID + "RAMANUJAM", quantity: remainingRamanujam.to_str() },
          { unit: HOPPER_POLICY_ID + "HOPPER", quantity: remainingHopper.to_str() },
        ])
      )
    )
    // adding the output UTXOs to the transaction
    for (let i = 0; i < outputs.len(); i++) {
      txBuilder.add_output(outputs.get(i));
    }



    // setting fee for the transaction
    txBuilder.set_fee(wasm.BigNum.from_str(FEE))


    // adding metadata to the transaction
    let aux_data;
    const metadata = { "1000": { "address": addrAL } }
    aux_data = wasm.AuxiliaryData.new();
    const generalMetadata = wasm.GeneralTransactionMetadata.new();
    Object.keys(metadata).forEach((label) => {
      generalMetadata.insert(
        wasm.BigNum.from_str(label),
        wasm.encode_json_str_to_metadatum(
          JSON.stringify(metadata[label]),
          1
        )
      );
    });
    aux_data.set_metadata(generalMetadata);
    txBuilder.set_auxiliary_data(aux_data);








    // building tx body without witness
    const txBody = txBuilder.build();


    // getting witnesses
    const transactionWitnessSet = wasm.TransactionWitnessSet.new();
    const tx = wasm.Transaction.new(
      txBody,
      wasm.TransactionWitnessSet.from_bytes(
        transactionWitnessSet.to_bytes()
      ),
      aux_data
    );
    let txVkeyWitnesses = await window.cardano.signTx(
      toHex(tx.to_bytes()),
      true
    );
    txVkeyWitnesses = wasm.TransactionWitnessSet.from_bytes(
      fromHex(txVkeyWitnesses)
    );
    transactionWitnessSet.set_vkeys(txVkeyWitnesses.vkeys());


    // signing transaction
    const signedTx = wasm.Transaction.new(
      tx.body(),
      transactionWitnessSet,
      tx.auxiliary_data()
    );

    // submitting transaction
    await window.cardano.submitTx(toHex(signedTx.to_bytes()));


  }


  // @info converting asset to value format specified by Cardano
  // @params assets - specifies the policy ID of the token and the quantity of tokens for each of the asset to be sent
  function assetsToValue(assets) {
    const multiAsset = wasm.MultiAsset.new();
    const lovelace = assets.find((asset) => asset.unit === "lovelace");
    const policies = [
      ...new Set(
        assets
          .filter((asset) => asset.unit !== "lovelace")
          .map((asset) => asset.unit.slice(0, 56))
      ),
    ];
    policies.forEach((policy) => {
      const policyAssets = assets.filter(
        (asset) => asset.unit.slice(0, 56) === policy
      );
      const assetsValue = wasm.Assets.new();
      policyAssets.forEach((asset) => {
        assetsValue.insert(
          wasm.AssetName.new(Buffer.from(asset.unit.slice(56))),
          wasm.BigNum.from_str(asset.quantity)
        );
      });
      multiAsset.insert(
        wasm.ScriptHash.from_bytes(Buffer.from(policy, "hex")),
        assetsValue
      );
    });
    const value = wasm.Value.new(
      wasm.BigNum.from_str(lovelace ? lovelace.quantity : "0")
    );
    if (assets.length > 1 || !lovelace) value.set_multiasset(multiAsset);
    return value;
  }

  // @info checking the equality between two uint8array
  // @params (buf1, buf2) - pair of uint8array to be compared
  function equal(buf1, buf2) {
    if (buf1.byteLength != buf2.byteLength) return false;
    var dv1 = new Int8Array(buf1);
    var dv2 = new Int8Array(buf2);
    for (var i = 0; i != buf1.byteLength; i++) {
      if (dv1[i] != dv2[i]) return false;
    }
    return true;
  }

  const bridgeTokenText = () => {
    if (bridgeToken === 0) {
      return "Which Token?"
    } else if (bridgeToken === 1) {
      return "Ramanujam"
    }
    return "Hopper"

  }




  // @info connects with the Metamask
  async function connectmetamask() {
    if (window.ethereum) {
      try {
        const accounts = (await window.ethereum.request({ method: 'eth_requestAccounts' }))[0];
        console.log(accounts)
        setL2SenderAddress(accounts);
      } catch (e) {
        alert(e.toString());
      }
    }
  }


  // @info for withdrawing tokens specified by the user in the UI  from L2 to Cardano
  async function withdrawtokens() {
    try {
      console.log("Enter more code here!")
      console.log(withdrawalTokenName)
      console.log(withdrawalTokenAmt)
      console.log(cardanoReceiverAddress)

      // determining which token contract address to use
      var tokenContractAddr;
      if (bridgeToken == 2) {
        tokenContractAddr = HOPPER_CONTRACT_ADDR
      } else if (bridgeToken == 1) {
        tokenContractAddr = RAMANUJAM_CONTRACT_ADDR
      } else {
        console.log("Please enter something legit!")
      }

      console.log(parseInt(withdrawalTokenAmt) + "000000000000000000")
      // estimating gas
      const gasEstimate = await l2BridgeContract.methods.withdrawal(tokenContractAddr, parseInt(withdrawalTokenAmt) + "000000000000000000", cardanoReceiverAddress).estimateGas({ from: l2SenderAddress, to: L2BRIDGE_ADDR })
      console.log(gasEstimate)

      // constructing transaction
      const tx = {
        'from': l2SenderAddress,
        'to': L2BRIDGE_ADDR,
        'gas': "0x" + gasEstimate.toString(16),
        'data': l2BridgeContract.methods.withdrawal(tokenContractAddr, parseInt(withdrawalTokenAmt) + "000000000000000000", cardanoReceiverAddress).encodeABI(),
        'chainId': '0x420'
      };

      console.log(l2SenderAddress)
      console.log(tx)
      // sending transaction
      const transactionHash = await window.ethereum.request({ method: 'eth_sendTransaction', params: [tx], });

      console.log(transactionHash);


    } catch (e) {
      alert(e.toString());
    }
  }



  return (
    <div className="App">


      <Navbar className="Navbar" bg="#025fa2" variant="dark">
        <Container>
          <Navbar.Brand href="#home">
            <img
              alt=""
              src={logo}
              width="400"
              height="100"
              className="d-inline-block align-top"
            />{' '}
          </Navbar.Brand>
          <DropdownButton variant="dark" align = "end" id="dropdown-basic-button" title="Select Wallet(s)" >
              <Dropdown.Item href="#/action-1" onclick={connectnami} >NamiWallet</Dropdown.Item>
              <Dropdown.Item href="#/action-2" onClick={connectmetamask} >Metamask</Dropdown.Item>
            </DropdownButton>
        </Container>
      </Navbar>

      <header className="App-header">

        <Container>
          <Row>
            <Col></Col>
            <Col xs={6}>



              <ButtonGroup bg="dark" aria-label="Basic example">
                
                <Button variant="dark" onClick={() => setDeposit(true)}>Deposit</Button>
                <Button variant="dark" onClick={() => setDeposit(false)}>Withdraw</Button>

              </ButtonGroup>

              <div style={{ height: 25 }}></div>



              {
                deposit ?
                  <>
                    <InputGroup className="mb-3" >
                      <InputGroup.Text id="basic-addon1">Amount of Ramanujam</InputGroup.Text>
                      <FormControl
                        value={bridgeRamanujam}
                        onChange={(ev) => {
                          if (/^[0-9]{0,40}$/.test(ev.target.value)) {
                            setBridgeRamanujamAmount(ev.target.value)
                          }
                        }}
                        placeholder="Amount"
                        aria-label="Username"
                        aria-describedby="basic-addon1"
                      />
                    </InputGroup>
                    <InputGroup className="mb-3">
                      <InputGroup.Text id="basic-addon1">Amount of Hopper</InputGroup.Text>
                      <FormControl
                        value={bridgeHopper}
                        onChange={(ev) => {
                          if (/^[0-9]{0,40}$/.test(ev.target.value)) {
                            setBridgeHopperAmount(ev.target.value)
                          }
                        }}
                        placeholder="Amount"
                        aria-label="Username"
                        aria-describedby="basic-addon1"
                      />
                    </InputGroup>
                    <InputGroup className="mb-3">
                      <InputGroup.Text id="basic-addon1">Amount of Lovelace</InputGroup.Text>
                      <FormControl
                        value={bridgeAda} onChange={(ev) => {
                          // console.log(ev.target.value, /^[1-9]{0,40}$/.test(ev.target.value))
                          if (/^[0-9]{0,40}$/.test(ev.target.value)) {
                            setBridgeAdaAmount(ev.target.value)
                          }
                        }}
                        placeholder="Amount"
                        aria-label="Username"
                        aria-describedby="basic-addon1"
                      />
                    </InputGroup>
                    <InputGroup className="mb-3">
                      <InputGroup.Text id="basic-addon1">Metamask Address</InputGroup.Text>
                      <FormControl
                        value={addrAL} onChange={(ev) => {
                          // if (/^0x[a-fA-F0-9]{0,40}$/.test(ev.target.value)) {
                          setAddrAceLayr(ev.target.value)
                          // }
                        }}
                        placeholder="Address"
                        aria-label="Username"
                        aria-describedby="basic-addon1"
                      />
                    </InputGroup>

                    <Button variant="success" onClick={bridgeTokens}>Deposit Tokens</Button>                  </>
                  : <>
                    <Dropdown>
                      <Dropdown.Toggle variant="dark" id="Which-Token">

                        {bridgeTokenText()}
                      </Dropdown.Toggle>

                      <Dropdown.Menu title="Which Token?">

                        <Dropdown.Item href="#/action-1" onClick={() => setBridgeToken(1)}>Ramanujam</Dropdown.Item>
                        <Dropdown.Item href="#/action-2" onClick={() => setBridgeToken(2)}>Hopper</Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>

                    <div style={{ height: 25 }}></div>


                    {/* <InputGroup className="mb-3">
                      <InputGroup.Text id="basic-addon1">Which Token?</InputGroup.Text>
                      <FormControl
                        value={withdrawalTokenName}
                        onChange={(ev) => {
                          if (/^[a-zA-Z]{0,40}$/.test(ev.target.value)) {
                            setWithdrawalTokenName(ev.target.value)
                          }
                        }}
                        placeholder="Name"
                        aria-label="Username"
                        aria-describedby="basic-addon1"
                      />
                    </InputGroup> */}

                    <InputGroup className="mb-3">
                      <InputGroup.Text id="basic-addon1">Amount of Token(s)</InputGroup.Text>
                      <FormControl
                        value={withdrawalTokenAmt}
                        onChange={(ev) => {
                          if (/^[0-9]{0,40}$/.test(ev.target.value)) {
                            setWithdrawalTokenAmt(ev.target.value)
                          }
                        }}
                        placeholder="Amount"
                        aria-label="Username"
                        aria-describedby="basic-addon1"
                      />
                    </InputGroup>


                    <InputGroup className="mb-3">
                      <InputGroup.Text id="basic-addon1">Cardano Rx Address</InputGroup.Text>
                      <FormControl
                        value={cardanoReceiverAddress}
                        onChange={(ev) => {
                          setCardanoReceiverAddress(ev.target.value)
                        }}
                        placeholder="Amount"
                        aria-label="Username"
                        aria-describedby="basic-addon1"
                      />
                    </InputGroup>

                    {/* for withdrawing from L2 */}
                    <Button variant="success" onClick={withdrawtokens}>Withdraw Tokens</Button>

                  </>
              }


              {/* Withdrawal Fields */}


            </Col>
            <Col></Col>
          </Row>
        </Container>



        <a
          className="App-link"
          href="https://reactj.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          {l2SenderAddress.toString()}
        </a>
      </header>
    </div>
  );
}




export default App;
