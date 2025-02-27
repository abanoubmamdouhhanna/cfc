export const sendOrderNotification = (io, order) => {
    try {
      if (!io) throw new Error("Socket.IO instance not found");
  
      io.to(order.locationId.toString()).emit("orderNotification", {
        orderId: order._id,
        address: order.address,
        totalPrice: order.totalPrice,
        createdAt: new Date(),
      });
    } catch (error) {
      console.error("Failed to send notifications:", error.message);
    }
  };
  