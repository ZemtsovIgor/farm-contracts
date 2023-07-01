import { assert } from "chai";
import {
  expectRevert,
  // @ts-ignore
} from "@openzeppelin/test-helpers";
import { parseEther } from "ethers/lib/utils";
import { artifacts, contract } from "hardhat";
import TokenConfig from "../config/TokenConfig";

const TFTToken = artifacts.require("./TFTToken.sol");

contract(TokenConfig.contractName, ([alice, bob, carol, david, minter]) => {
  let tft: any;

  before(async () => {
    // Deploy TFT
    tft = await TFTToken.new({ from: minter });
  });

  describe("Normal cases:", async () => {
    it("Check initial data", async function () {
      assert.equal(String(await tft.name()), "VUL TOKEN");
      assert.equal(String(await tft.symbol()), "VUL");
      assert.equal(
        String(await tft.MAX_AMOUNT()),
        parseEther("10000000").toString()
      );
      assert.equal(String(await tft.owner()), minter);
    });

    it("Mint and approve all contracts", async function () {
      await tft.mint(
        alice,
        parseEther("1000000"),
        { from: minter }
      );

      await tft.mint(
        bob,
        parseEther("1000000"),
        { from: minter }
      );

      await tft.mint(
        carol,
        parseEther("1000000"),
        { from: minter }
      );

      assert.equal(
        String(await tft.totalSupply()),
        parseEther("3000000").toString()
      );

      assert.equal(
        String(await tft.balanceOf(alice)),
        parseEther("1000000").toString()
      );

      assert.equal(
        String(await tft.balanceOf(bob)),
        parseEther("1000000").toString()
      );

      assert.equal(
        String(await tft.balanceOf(carol)),
        parseEther("1000000").toString()
      );
    });

    // it("Burn tokens", async function () {
    //   await tft.burn(
    //     parseEther("1000000"),
    //     { from: minter }
    //   );
    //
    //   assert.equal(
    //     String(await tft.balanceOf(minter)),
    //     parseEther("0").toString()
    //   );
    //
    //   assert.equal(
    //     String(await tft.totalSupply()),
    //     parseEther("2000000").toString()
    //   );
    // });

    it("Transactions", async function () {
      await tft.transfer(
        bob,
        parseEther("1000000"),
        { from: alice }
      );

      assert.equal(
        String(await tft.balanceOf(alice)),
        parseEther("0").toString()
      );

      assert.equal(
        String(await tft.balanceOf(bob)),
        parseEther("2000000").toString()
      );
    });

    it("Delegate", async function () {
      await tft.delegate(
        bob,
        { from: alice }
      );

      assert.equal(
        String(await tft.balanceOf(alice)),
        parseEther("0").toString()
      );

      assert.equal(
        String(await tft.balanceOf(bob)),
        parseEther("2000000").toString()
      );
    });
  });

  describe("Restrictions:", async () => {
    it("Mint from users", async function () {
      await expectRevert(
        tft.mint(
          david,
          parseEther("1000000"),
          { from: david }
        ),
        "Ownable: caller is not the owner"
      );

      assert.equal(
        String(await tft.balanceOf(alice)),
        parseEther("0").toString()
      );

      assert.equal(
        String(await tft.balanceOf(bob)),
        parseEther("2000000").toString()
      );

      assert.equal(
        String(await tft.balanceOf(carol)),
        parseEther("1000000").toString()
      );

      assert.equal(
        String(await tft.totalSupply()),
        parseEther("3000000").toString()
      );
    });

    it("Burn from users", async function () {
      await expectRevert(
        tft.burn(
          parseEther("1000000"),
          { from: bob }
        ),
        "Ownable: caller is not the owner"
      );

      assert.equal(
        String(await tft.balanceOf(alice)),
        parseEther("0").toString()
      );

      assert.equal(
        String(await tft.balanceOf(bob)),
        parseEther("2000000").toString()
      );

      assert.equal(
        String(await tft.balanceOf(carol)),
        parseEther("1000000").toString()
      );

      assert.equal(
        String(await tft.totalSupply()),
        parseEther("3000000").toString()
      );
    });

    it("Minting over max amount from owner", async function () {
      await expectRevert(
        tft.mint(
          alice,
          parseEther("10000001"),
          { from: minter }
        ),
        "Can't mint more than max amount"
      );

      assert.equal(
        String(await tft.balanceOf(alice)),
        parseEther("0").toString()
      );

      assert.equal(
        String(await tft.balanceOf(bob)),
        parseEther("2000000").toString()
      );

      assert.equal(
        String(await tft.balanceOf(carol)),
        parseEther("1000000").toString()
      );

      assert.equal(
        String(await tft.totalSupply()),
        parseEther("3000000").toString()
      );
    });
  });
});
