import { assert } from "chai";
import {
  BN,
  expectEvent,
  expectRevert,
  time,
  constants,
  // @ts-ignore
} from "@openzeppelin/test-helpers";
import { parseEther } from "ethers/lib/utils";
import { artifacts, contract } from "hardhat";

const MockERC20 = artifacts.require("./test/MockERC20.sol");
const RewarderMock = artifacts.require("./test/RewarderMock.sol");
const TBCCDEFIAPES = artifacts.require("./test/TBCCDEFIAPES.sol");
const TBCCMasterChef = artifacts.require("./TBCCMasterChef.sol");
const TFTToken = artifacts.require("./TFTToken.sol");

contract("TBCCMasterChef", ([alice, bob, carol, minter]) => {
  let tbccMasterChef: any;
  let tft: any;
  let tbccApes: any;
  let mockBUSD: any;
  let tokenLP1: any;
  let tokenLP2: any;
  let tokenLP3: any;
  let rewarder: any;
  let result: any;
  let result2: any;
  let startBlock: any;
  // 0.000000191368750578TFT per block (0.191368750578213200 * 1e12)
  const tftPerBlock = parseEther("0.172923569799590200");

  before(async () => {
    // Deploy ERC20s
    tft = await TFTToken.new({ from: minter });

    tokenLP1 = await MockERC20.new(
      "Mock Pool Token 1",
      "LP1",
      parseEther("1000000"),
      { from: minter }
    );

    tokenLP2 = await MockERC20.new(
      "Mock Pool Token 2",
      "LP2",
      parseEther("1000000"),
      { from: minter }
    );

    tokenLP3 = await MockERC20.new(
      "Mock Pool Token 3",
      "LP3",
      parseEther("1000000"),
      { from: minter }
    );

    mockBUSD = await MockERC20.new("BUSD", "BUSD", parseEther("1000000"), {
      from: minter,
    });

    // Deploy Apes
    tbccApes = await TBCCDEFIAPES.new(
      mockBUSD.address,
      "TBCC DEFI APES",
      "TDA",
      { from: minter }
    );

    // Deploy TBCCMasterChef
    startBlock = new BN(100);
    tbccMasterChef = await TBCCMasterChef.new(
      tft.address,
      tbccApes.address,
      tftPerBlock,
      startBlock,
      parseEther("10"),
      { from: minter }
    );

    // Deploy Rewarder
    rewarder = await RewarderMock.new(
      parseEther("1"),
      tft.address,
      tbccMasterChef.address,
      { from: minter }
    );

    await tft.transferOwnership(tbccMasterChef.address, { from: minter });

    await tokenLP1.transfer(bob, parseEther("2000"), { from: minter });
    await tokenLP2.transfer(bob, parseEther("2000"), { from: minter });
    await tokenLP3.transfer(bob, parseEther("2000"), { from: minter });

    await tokenLP1.transfer(alice, parseEther("2000"), { from: minter });
    await tokenLP2.transfer(alice, parseEther("2000"), { from: minter });
    await tokenLP3.transfer(alice, parseEther("2000"), { from: minter });

    await mockBUSD.transfer(alice, parseEther("2000"), { from: minter });
    await tbccApes.setPaused(false, { from: minter });
    await mockBUSD.approve(tbccApes.address, parseEther("2000"), {
      from: alice,
    });
    await tbccApes.mintNFT("10", { from: alice });
  });

  describe("MASTER CHEF #1 - NO POOL LIMIT", async () => {
    it("Initial parameters are correct", async () => {
      assert.equal(
        String(await tbccMasterChef.tftPerBlock()),
        tftPerBlock.toString()
      );
      assert.equal(
        String(await tbccMasterChef.startBlock()),
        startBlock.toString()
      );
    });

    it("Add LPs", async () => {
      await time.advanceBlockTo(startBlock);

      result = await tbccMasterChef.add(
        10,
        tokenLP1.address,
        constants.ZERO_ADDRESS,
        { from: minter }
      );

      expectEvent(result, "LogPoolAddition", {
        pid: "0",
        allocPoint: "10",
        lpToken: tokenLP1.address,
        rewarder: constants.ZERO_ADDRESS,
      });

      await expectRevert(
        tbccMasterChef.add(10, tokenLP1.address, constants.ZERO_ADDRESS, {
          from: alice,
        }),
        "Ownable: caller is not the owner"
      );

      assert.equal(String((await tbccMasterChef.poolLength()).toString()), "1");
    });

    it("Should emit event LogSetPool", async () => {
      result = await tbccMasterChef.set(0, 10, rewarder.address, true, {
        from: minter,
      });

      expectEvent(result, "LogSetPool", {
        pid: "0",
        allocPoint: "10",
        rewarder: rewarder.address,
        overwrite: true,
      });

      result = await tbccMasterChef.set(0, 10, constants.ZERO_ADDRESS, true, {
        from: minter,
      });

      expectEvent(result, "LogSetPool", {
        pid: "0",
        allocPoint: "10",
        rewarder: constants.ZERO_ADDRESS,
        overwrite: true,
      });

      await expectRevert(
        tbccMasterChef.set(0, 10, constants.ZERO_ADDRESS, true, {
          from: alice,
        }),
        "Ownable: caller is not the owner"
      );
    });
  });

  it("Compare balances", async () => {
    assert.equal(String(await tft.balanceOf(alice)), String(parseEther("0")));
    assert.equal(
      String(await tokenLP1.balanceOf(alice)),
      String(parseEther("2000"))
    );
  });

  describe("Pending TBCC", async () => {
    it("PendingTBCC should equal ExpectedTBCC", async () => {
      await tokenLP1.approve(tbccMasterChef.address, parseEther("1000"), {
        from: alice,
      });

      result = await tbccMasterChef.deposit(0, parseEther("1"), alice, {
        from: alice,
      });

      // const pool = await tbccMasterChef.poolInfo(0);
      // const user = await tbccMasterChef.userInfo(0, alice);
      // console.log('accTFTPerShare', pool.accTFTPerShare.toString());
      // console.log('lastRewardBlock', pool.lastRewardBlock.toString());
      // console.log('allocPoint', pool.allocPoint.toString());
      // console.log('amount', user.amount.toString());
      // console.log('rewardDebt', user.rewardDebt.toString());
      // console.log('balance', (await tokenLP1.balanceOf(tbccMasterChef.address)).toString());
      // console.log('totalAllocPoint', (await tbccMasterChef.totalAllocPoint()).toString());

      result2 = await tbccMasterChef.updatePool(0);

      expectEvent(result2, "LogUpdatePool", {
        pid: "0",
        lastRewardBlock: "108",
        lpSupply: parseEther("1").toString(),
        accTFTPerShare: parseEther("0.000000172923569799").toString(),
      });

      await time.advanceBlock();

      const expectedTBCC = new BN(parseEther("0.172923569799").toString()).mul(
        BN(result2.receipt.blockNumber + 1 - result.receipt.blockNumber)
      );
      const pendingTBCC = await tbccMasterChef.pendingReward(0, alice);

      assert.equal(String(pendingTBCC), String(expectedTBCC));
      // 40 * 2
      assert.equal(String(pendingTBCC), String(parseEther("0.345847139598")));
    });
  });

  describe("Add", async () => {
    it("Should add pool with reward token multiplier", async () => {
      result = await tbccMasterChef.add(
        10,
        tokenLP2.address,
        constants.ZERO_ADDRESS,
        { from: minter }
      );

      expectEvent(result, "LogPoolAddition", {
        pid: "1",
        allocPoint: "10",
        lpToken: tokenLP2.address,
        rewarder: constants.ZERO_ADDRESS,
      });
    });
  });

  describe("UpdatePool", async () => {
    it("Should emit event LogUpdatePool", async () => {
      await time.advanceBlockTo(117);

      result = await tbccMasterChef.updatePool(1);

      const supply = await tokenLP2.balanceOf(tbccMasterChef.address);
      const share = await tbccMasterChef.poolInfo(1);

      expectEvent(result, "LogUpdatePool", {
        pid: "1",
        lastRewardBlock: share.lastRewardBlock,
        lpSupply: supply,
        accTFTPerShare: share.accTFTPerShare,
      });
    });
  });

  describe("Deposit", async () => {
    it("Depositing 0 amount", async () => {
      result = await tbccMasterChef.deposit(1, parseEther("0"), alice, {
        from: alice,
      });

      expectEvent(result, "Deposit", {
        user: alice,
        pid: "1",
        amount: "0",
        to: alice,
      });
    });
  });

  describe("Withdraw", async () => {
    it("Withdraw 0 amount", async () => {
      result = await tbccMasterChef.withdraw(1, parseEther("0"), alice, {
        from: alice,
      });

      expectEvent(result, "Withdraw", {
        user: alice,
        pid: "1",
        amount: "0",
        to: alice,
      });
    });
  });

  describe("Harvest", async () => {
    it("Should give back the correct amount of TBCC and reward", async () => {
      await tokenLP2.approve(tbccMasterChef.address, parseEther("1000"), {
        from: bob,
      });

      result = await tbccMasterChef.deposit(1, parseEther("1"), bob, {
        from: bob,
      });

      await time.advanceBlockTo(150);

      await tbccMasterChef.deposit(1, parseEther("0"), bob, {
        from: bob,
      });

      result2 = await tbccMasterChef.updatePool(1);

      expectEvent(result2, "LogUpdatePool", {
        pid: "1",
        lastRewardBlock: "152",
        lpSupply: parseEther("1").toString(),
        accTFTPerShare: parseEther("0.000002593853546993").toString(),
      });

      // const expectedTBCC = new BN(parseEther("0.1913687505782").toString())
      //   .mul(BN(result2.receipt.blockNumber + 1 - result.receipt.blockNumber))
      //   .div(BN(2));

      await tbccMasterChef.harvest(1, bob, {
        from: bob,
      });

      // assert.equal(String(await tft.balanceOf(bob)), String(expectedTBCC));

      // assert.equal(
      //   String((await tbccMasterChef.userInfo(1, bob)).rewardDebt),
      //   `${expectedTBCC}`
      // );
    });

    it("Update TFT Per Block", async () => {
      assert.equal(
        String(await tbccMasterChef.pendingReward(0, alice)),
        parseEther("4.063703890289000000").toString()
      );
      // await time.advanceBlockTo(150);

      // await tbccMasterChef.deposit(0, parseEther("0"), alice, {
      //   from: alice,
      // });

      result = await tbccMasterChef.addNewBonus(153, 50, {
        from: minter,
      });

      expectEvent(result, "AddNewBonus", {
        startBlock: "153",
        bonus: "50",
      });

      await time.advanceBlockTo(155);

      result = await tbccMasterChef.updatePool(0);

      expectEvent(result, "LogUpdatePool", {
        pid: "0",
        lastRewardBlock: "156",
        lpSupply: parseEther("1").toString(),
        accTFTPerShare: parseEther("0.000004150165675188").toString(),
      });

      // 940 + 20 = 960
      assert.equal(
        String(await tbccMasterChef.pendingReward(0, alice)),
        parseEther("4.150165675188").toString()
      );
    });

    it("Update TFT Per Block In Future", async () => {
      assert.equal(
        String(await tbccMasterChef.pendingReward(0, alice)),
        parseEther("4.150165675188").toString()
      );

      result = await tbccMasterChef.addNewBonus(158, 200, {
        from: minter,
      });

      expectEvent(result, "AddNewBonus", {
        startBlock: "158",
        bonus: "200",
      });

      await time.advanceBlockTo(160);

      result = await tbccMasterChef.updatePool(0);

      expectEvent(result, "LogUpdatePool", {
        pid: "0",
        lastRewardBlock: "161",
        lpSupply: parseEther("1").toString(),
        accTFTPerShare: parseEther("0.000004668936384586").toString(),
      });

      // 940 + 20 = 960
      assert.equal(
        String(await tbccMasterChef.pendingReward(0, alice)),
        parseEther("4.668936384586").toString()
      );
    });

    it("TFT Per Block to ZERO", async () => {
      assert.equal(
        String(await tbccMasterChef.pendingReward(0, alice)),
        parseEther("4.668936384586").toString()
      );

      result = await tbccMasterChef.addNewBonus(162, 0, {
        from: minter,
      });

      expectEvent(result, "AddNewBonus", {
        startBlock: "162",
        bonus: "0",
      });

      await time.advanceBlockTo(262);

      result = await tbccMasterChef.updatePool(0);

      expectEvent(result, "LogUpdatePool", {
        pid: "0",
        lastRewardBlock: "263",
        lpSupply: parseEther("1").toString(),
        accTFTPerShare: parseEther("0.000004841859954385").toString(),
      });

      // 4.841859954385 - 4.668936384586 = 0.172923569799 (162 Block)
      assert.equal(
        String(await tbccMasterChef.pendingReward(0, alice)),
        parseEther("4.841859954385").toString()
      );
    });

    it("Claiming TFT per TBCC TDA", async () => {
      assert.equal(
        String(await tft.balanceOf(alice)),
        parseEther("0").toString()
      );

      await expectRevert(
        tbccMasterChef.apesClaim(1, {
          from: minter,
        }),
        "Only TBCC DEFI APES NFT holder"
      );

      result = await tbccMasterChef.apesClaim(1, {
        from: alice,
      });

      expectEvent(result, "NFTTDAClaimed", {
        sender: alice,
        tokenId: "1",
        amount: parseEther("1").toString(),
      });

      assert.equal(
        String(await tft.balanceOf(alice)),
        parseEther("1").toString()
      );

      await expectRevert(
        tbccMasterChef.apesClaim(1, {
          from: alice,
        }),
        "TBCCMasterChef: TBCC TDA already claimed"
      );

      await expectRevert(
        tbccMasterChef.setApesClaimAmount(parseEther("15"), {
          from: alice,
        }),
        "Ownable: caller is not the owner"
      );

      result = await tbccMasterChef.setApesClaimAmount(parseEther("15"), {
        from: minter,
      });

      expectEvent(result, "NewClaimApesAmount", {
        newAmount: parseEther("15").toString(),
      });

      result = await tbccMasterChef.apesClaim(2, {
        from: alice,
      });

      expectEvent(result, "NFTTDAClaimed", {
        sender: alice,
        tokenId: "2",
        amount: parseEther("15").toString(),
      });

      assert.equal(
        String(await tft.balanceOf(alice)),
        parseEther("25").toString()
      );
    });

    it("Changing ownership", async () => {
      await expectRevert(
        tft.burn(parseEther("100"), {
          from: carol,
        }),
        "Ownable: caller is not the owner"
      );

      await tbccMasterChef.changeOwnershipTFTContract(carol, {
        from: minter,
      });

      await tft.mint(carol, parseEther("100"), {
        from: carol,
      });

      assert.equal(
        String(await tft.balanceOf(carol)),
        parseEther("100").toString()
      );

      result = await tft.burn(parseEther("100"), {
        from: carol,
      });

      expectEvent(result, "Transfer", {
        from: carol,
        to: constants.ZERO_ADDRESS,
        value: parseEther("100").toString(),
      });

      assert.equal(
        String(await tft.balanceOf(carol)),
        parseEther("0").toString()
      );
    });
  });
});
