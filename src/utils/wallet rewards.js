import walletModel from "../../DB/models/Wallet.model.js";

export async function rewardCustomer(userId, orderId, amountSpent) {
  const rewardAmount = parseFloat((amountSpent * 0.01).toFixed(2)) // 1 cent per $1 spent

  let wallet = await walletModel.findOne({ userId });

  if (!wallet) {
    wallet = await walletModel.create({ userId, balance: 0, transactions: [] });
  }

  // Update wallet balance and add a transaction
  wallet.balance = parseFloat((wallet.balance + rewardAmount).toFixed(2));
  wallet.transactions.push({
    type: "reward",
    amount: rewardAmount,
    orderId,
  });

  await wallet.save();
}

export async function payWithEwallet(userId, orderTotal) {
  const wallet = await walletModel.findOne({ userId });

  // Check if wallet exists and has sufficient balance
  if (!wallet || wallet.balance < orderTotal) {
    throw new Error("Insufficient E-Wallet balance to place the order.",{cause:400});
  }

  // Deduct the exact order amount
  wallet.balance -= orderTotal;

  // Add transaction record
  wallet.transactions.push({
    type: "spend",
    amount: orderTotal,
  });

  await wallet.save();
  return orderTotal;
}