const { randomUUID } = require("crypto");
const { recordPayout } = require("../data/store");

const processInstantPayout = ({ userId, policyId, claimId, amount, meta = {} }) => {
  const reference = `rzp_test_${randomUUID().slice(0, 10)}`;

  const payout = recordPayout({
    userId,
    policyId,
    claimId,
    amount: Number(amount || 0),
    reference,
    gateway: "razorpay-test-simulator",
    mode: "sandbox",
    status: "processed",
    meta: {
      settlementType: "instant-wallet-credit",
      processedBy: "mock-payout-orchestrator-v1",
      ...meta
    }
  });

  return payout;
};

module.exports = {
  processInstantPayout
};
