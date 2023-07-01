// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;
pragma abicoder v2;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "../../lib/IBEP20.sol";
import "../../lib/SafeBEP20.sol";


contract RewarderMock {
    using SafeMath for uint256;
    using SafeBEP20 for IBEP20;

    uint256 private immutable rewardMultiplier;
    IBEP20 private immutable rewardToken;
    uint256 private constant REWARD_TOKEN_DIVISOR = 1e18;
    address private immutable MASTERCHEF;

    modifier onlyMCV {
        require(msg.sender == MASTERCHEF, "Rewarder: Only TBCCMCV can call this function.");
        _;
    }

    constructor (
        uint256 _rewardMultiplier,
        IBEP20 _rewardToken,
        address _MASTERCHEF
    ) public {
        rewardMultiplier = _rewardMultiplier;
        rewardToken = _rewardToken;
        MASTERCHEF = _MASTERCHEF;
    }

    function onTBCCReward (
        uint256 _pid,
        address _user,
        address _to,
        uint256 _tbccAmount,
        uint256 _userAmount
    ) onlyMCV external {
        uint256 pendingReward = _tbccAmount.mul(rewardMultiplier) / REWARD_TOKEN_DIVISOR;
        uint256 rewardBal = rewardToken.balanceOf(address(this));
        if (pendingReward > rewardBal) {
            rewardToken.safeTransfer(_to, rewardBal);
        } else {
            rewardToken.safeTransfer(_to, pendingReward);
        }
    }

    function pendingTokens(
        uint256 _pid,
        address _user,
        uint256 _tbccAmount
    ) external view returns (IBEP20[] memory rewardTokens, uint256[] memory rewardAmounts) {
        IBEP20[] memory _rewardTokens = new IBEP20[](1);
        _rewardTokens[0] = (rewardToken);
        uint256[] memory _rewardAmounts = new uint256[](1);
        _rewardAmounts[0] = _tbccAmount.mul(rewardMultiplier) / REWARD_TOKEN_DIVISOR;
        return (_rewardTokens, _rewardAmounts);
    }
}
