import walletModel from "../../DB/models/Wallet.model.js";

export async function rewardCustomer(userId, orderId, amountSpent) {
  const rewardAmount = amountSpent * 0.01; // 1 cent per $1 spent

  let wallet = await walletModel.findOne({ userId });

  if (!wallet) {
    wallet = await walletModel.create({ userId, balance: 0, transactions: [] });
  }

  // Update wallet balance and add a transaction
  wallet.balance += rewardAmount;
  wallet.transactions.push({
    type: "reward",
    amount: rewardAmount,
    orderId,
  });

  await wallet.save();
}

export async function payWithEwallet(userId, orderTotal) {
    const wallet = await walletModel.findOne({ userId });
  
    if (!wallet || wallet.balance === 0) {
      throw new Error("Insufficient E-Wallet balance");
    }
  
    const amountToDeduct = Math.min(wallet.balance, orderTotal); // Use max available balance
    wallet.balance -= amountToDeduct;
  
    wallet.transactions.push({
      type: "spend",
      amount: amountToDeduct,
    });
  
    await wallet.save();
    return amountToDeduct;
  }
  