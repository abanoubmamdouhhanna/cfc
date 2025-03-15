import walletModel from "../../DB/models/Wallet.model.js";

const POINTS_PER_DOLLAR = 10; // 10 points per $1 spent
const POINTS_TO_DOLLAR_CONVERSION = 100; // 100 points = $1

export async function rewardCustomer(userId, orderId, amountSpent) {
  const earnedPoints = Math.floor(amountSpent * POINTS_PER_DOLLAR); // Convert $ to points

  let wallet = await walletModel.findOne({ userId });

  if (!wallet) {
    wallet = await walletModel.create({ userId, balance: 0, points: 0, transactions: [] });
  }

  // Add earned points
  wallet.points += earnedPoints;

  // Log the reward transaction
  wallet.transactions.push({
    type: "reward",
    points: earnedPoints,
    orderId,
  });

  await wallet.save();
}

export async function redeemPoints(userId, pointsToRedeem) {
  let wallet = await walletModel.findOne({ userId });

  if (!wallet || wallet.points < pointsToRedeem) {
    throw new Error("Not enough points to redeem.", { cause: 400 });
  }

  // Ensure pointsToRedeem is in multiples of 100
  if (pointsToRedeem % POINTS_TO_DOLLAR_CONVERSION !== 0) {
    throw new Error(`You can only redeem points in multiples of ${POINTS_TO_DOLLAR_CONVERSION}.`, { cause: 400 });
  }

  // Convert points to dollars
  const redeemedAmount = pointsToRedeem / POINTS_TO_DOLLAR_CONVERSION;
  wallet.points -= pointsToRedeem;
  wallet.balance += redeemedAmount;

  // Log the redemption transaction
  wallet.transactions.push({
    type: "redeem",
    points: -pointsToRedeem,
    amount: redeemedAmount,
  });

  await wallet.save();
  return redeemedAmount;
}

export async function payWithEwallet(userId, orderTotal) {
  const wallet = await walletModel.findOne({ userId });

  if (!wallet || wallet.balance < orderTotal) {
    throw new Error("Insufficient E-Wallet balance to place the order.", { cause: 400 });
  }

  // Deduct order amount
  wallet.balance -= orderTotal;

  // Log spending transaction
  wallet.transactions.push({
    type: "spend",
    amount: orderTotal,
  });

  await wallet.save();
  return orderTotal;
}
