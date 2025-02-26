import cron from "node-cron";
import orderModel from "../../DB/models/Order.model.js";

export function startOrderCleanupJob() {
  cron.schedule("* * * * *", async () => {
    try {
      const result = await orderModel.deleteMany({
        status: "Pending",
        createdAt: { $lt: new Date(Date.now() - 30 * 60 * 1000) }, // Orders older than 30 mins
      });

      if (result.deletedCount > 0) {
        console.log(`Deleted ${result.deletedCount} expired unpaid orders.`);
      }
    } catch (error) {
      console.error("Error deleting expired orders:", error);
    }
  });

  console.log("Cron job started: Checking for expired orders every minute...");
}
