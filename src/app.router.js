import cookieParser from "cookie-parser"
import connectDB from "../DB/connection.js";
import { glopalErrHandling } from "./utils/errorHandling.js";
import authRouter from "./modules/auth/auth.router.js";
import userRouter from "./modules/user/user.router.js";
import categoryRouter from "./modules/category/category.router.js";
import aboutRouter from "./modules/about/about.router.js";
import careerRouter from "./modules/career/career.router.js";
import locationRouter from "./modules/locations/locations.router.js";
import feedbackRouter from "./modules/feedback/feedback.router.js";
import hireRouter from "./modules/hire/hire.router.js";
import jobRouter from "./modules/job/job.router.js";
import newsLetterRouter from "./modules/newsletter/newsletter.router.js";
import franchiseRouter from "./modules/franchise/franchise.router.js";
import teamRouter from "./modules/team/team.router.js";
import reviewRouter from "./modules/reviews/reviews.router.js";
import orderRouter from "./modules/order/order.router.js";
import cartRouter from "./modules/cart/cart.router.js";
import couponRouter from "./modules/coupon/coupon.router.js"
import paymentRouter from "./utils/paymentRouter.js";
import wishlistRouter from './modules/wishlist/wishlist.router.js'

const initApp = (app, express) => {
  app.use(express.json({}));
  app.use(cookieParser()) 


  app.use("/auth", authRouter);
  app.use("/user", userRouter);
  app.use("/category", categoryRouter);
  app.use("/about", aboutRouter);
  app.use("/career", careerRouter);
  app.use("/location", locationRouter);
  app.use("/feedback", feedbackRouter);
  app.use("/hire", hireRouter);
  app.use("/job", jobRouter);
  app.use("/newsLetter", newsLetterRouter);
  app.use("/franchise", franchiseRouter);
  app.use("/team", teamRouter);
  app.use("/review", reviewRouter);
  app.use("/order", orderRouter);
  app.use("/cart", cartRouter);
  app.use("/coupon",couponRouter)
  app.use("/wishlist",wishlistRouter)



  app.use("/payment", paymentRouter);




  app.all("*", (req, res, next) => {
    return next(new Error("error 404 in-valid routing", { cause: 404 }));
  });

  app.use(glopalErrHandling);

  //connect DataBase
  connectDB();
};

export default initApp;
