import wallet from "../wba-wallet.json"
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults"
import { createGenericFile, createSignerFromKeypair, signerIdentity } from "@metaplex-foundation/umi"
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys"

// Create a devnet connection
const umi = createUmi('https://api.devnet.solana.com');

let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signer = createSignerFromKeypair(umi, keypair);

umi.use(irysUploader());
umi.use(signerIdentity(signer));

(async () => {
    try {
        // Follow this JSON structure
        // https://docs.metaplex.com/programs/token-metadata/changelog/v1.0#json-structure

        const image = createGenericFile(
          "https://arweave.net/4DEqKqfMU1Q48AUuiCaNsQmY2NwYBMrn1d2imBhQR6Sz", "Cool Rug"
        );
        const metadata = {
          name: "Cool Rug",
          symbol: "CRG",
          description: "A Super Beautiful RUG",
          image: image,
          attributes: [{ trait_type: "NFT", value: "RUG" }],
          properties: {
            files: [
              {
                type: "image/png",
                uri: "https://arweave.net/4DEqKqfMU1Q48AUuiCaNsQmY2NwYBMrn1d2imBhQR6Sz",
              },
            ],
          },
          creators: [],
        };
        const myUri = await umi.uploader.uploadJson(metadata)
        console.log("Your metadata URI: ", myUri);
    }
    catch(error) {
        console.log("Oops.. Something went wrong", error);
    }
})();
