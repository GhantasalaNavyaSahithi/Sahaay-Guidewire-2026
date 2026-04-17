const { addFeed, createClaim } = require("../data/store");
const { evaluateFraudGuard } = require("./fraudService");
const { processInstantPayout } = require("./paymentGatewayService");

const combineConfidence = (fraudCheck, modelVerification) => {
  const fraudConfidence = Number(fraudCheck?.confidence || 0);
  const modelConfidence = Number(modelVerification?.confidence || 0.72);
  const confidence = fraudConfidence * 0.55 + modelConfidence * 0.45;
  return Math.max(0.01, Math.min(0.99, Number(confidence.toFixed(2))));
};

const processClaimPipeline = async ({
  user,
  policy,
  type,
  payoutAmount,
  source,
  triggerLabel,
  triggerMessage,
  severity = "medium",
  claimInput = {},
  modelVerification
}) => {
  const fraudCheck = await evaluateFraudGuard({
    user,
    policy,
    claimType: type,
    reportedLocation: claimInput.reportedLocation,
    declaredReason: claimInput.declaredReason,
    deviceMeta: claimInput.deviceMeta
  });

  const modelApproved = modelVerification?.approved ?? true;
  const approved = fraudCheck.approved && modelApproved;
  const confidence = combineConfidence(fraudCheck, modelVerification);

  const verification = {
    approved,
    confidence,
    reasons: [...(modelVerification?.reasons || []), ...(fraudCheck.reasons || [])],
    fraudFlag: !approved,
    antiCheat: fraudCheck,
    model: modelVerification || { approved: true, confidence: 0.72, reasons: ["default model confidence"] }
  };

  const claim = createClaim({
    userId: user.id,
    policyId: policy.id,
    type,
    payoutAmount,
    source,
    autoTriggered: true,
    verification,
    status: approved ? "Approved" : "Flagged"
  });

  if (!approved) {
    addFeed({
      kind: "fraud",
      title: `${triggerLabel || type} claim flagged`,
      description: `${user.name || "Worker"} claim paused due to anti-cheat mismatch (${Math.round(confidence * 100)}% confidence).`,
      severity: "high",
      source: "fraud-guard",
      userId: user.id,
      policyId: policy.id,
      claimId: claim.id
    });

    return { claim, payout: null, fraudCheck };
  }

  const payout = processInstantPayout({
    userId: user.id,
    policyId: policy.id,
    claimId: claim.id,
    amount: payoutAmount,
    meta: {
      triggerType: type,
      triggerLabel: triggerLabel || type,
      source
    }
  });

  addFeed({
    kind: "claim",
    title: `${triggerLabel || type} resolved automatically`,
    description: `${user.name || "Worker"} received ₹${payoutAmount} instantly via sandbox wallet payout after ${String(triggerMessage || "automated verification").toLowerCase()}.`,
    severity,
    source,
    userId: user.id,
    policyId: policy.id,
    claimId: claim.id
  });

  addFeed({
    kind: "payout",
    title: "Instant payout settled",
    description: `₹${payoutAmount} transferred to worker wallet (${payout.reference}) without human approval queue.`,
    severity: "low",
    source: payout.gateway,
    userId: user.id,
    policyId: policy.id,
    claimId: claim.id
  });

  return { claim, payout, fraudCheck };
};

module.exports = {
  processClaimPipeline
};
