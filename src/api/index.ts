import express from "express";

import { parseV1 } from "./parse-v1";
import { parseV2 } from "./parse-v2";

const router = express.Router();

const safeTry = (handlerFn: any) => {
  const runner = async (
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    try {
      await handlerFn(req, res, next);
    } catch (err) {
      console.error(`Encountered error: ${err}`);
      next(err);
    }
  };

  return runner;
};

router.use("/parse", safeTry(parseV1));
router.use("/parse2", safeTry(parseV2));

export default router;
