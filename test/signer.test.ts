import { assert } from "chai";
import { arrayify, formatBytes32String, keccak256 } from "ethers/lib/utils";
import { dumpFr, dumpG2, sign } from "../src/mcl";
import { aggregate, BlsSignerFactory } from "../src/signer";

describe("BLS Signer", async () => {
    // Domain is a data that signer and verifier must agree on
    // A verifier considers a signature invalid if it is signed with a different domain
    const DOMAIN = arrayify(keccak256("0x1234ABCD"));

    it("verify single signature", async function () {
        // message should be a hex string
        const message = formatBytes32String("Hello");

        const factory = await BlsSignerFactory.new();

        // A signer can be instantiate with new key pair generated
        const signer = factory.getSigner(DOMAIN);
        // ... or with an existing secret
        const signer2 = factory.getSigner(DOMAIN, "0xabcd");

        const signature = signer.sign(message);

        assert.isTrue(signer.verify(signature, signer.pubkey, message));
        assert.isFalse(signer.verify(signature, signer2.pubkey, message));
    });
    it.only("dump private key", async function(){
        const factory = await BlsSignerFactory.new();
        const secretHex = "0x5566"
        const signer = factory.getSigner(DOMAIN, secretHex);
        console.log("secret", dumpFr(signer.secret))
        console.log(signer.pubkey)
        console.log(dumpG2(signer.pubkey))
    })
    it("verify aggregated signature", async function () {
        const factory = await BlsSignerFactory.new();
        const rawMessages = ["Hello", "how", "are", "you"];
        const signers = [];
        const messages = [];
        const pubkeys = [];
        const signatures = [];
        for (const raw of rawMessages) {
            const message = formatBytes32String(raw);
            const signer = factory.getSigner(DOMAIN);
            const signature = signer.sign(message);
            signers.push(signer);
            messages.push(message);
            pubkeys.push(signer.pubkey);
            signatures.push(signature);
        }
        const aggSignature = aggregate(signatures);
        assert.isTrue(
            signers[0].verifyMultiple(aggSignature, pubkeys, messages)
        );
    });
});
