import express from "express";
import moment from "moment";
import * as env from "env-var";
import axios from "axios";
import puppeteer from "puppeteer";

const router = express.Router();

interface ParseParams {
  type: string;
  id: string;
}

interface YouTubeApiItem {
  id: string;
  snippet: {
    title: string;
    thumbnails: {
      default: {
        url: string;
      };
    };
  };
  contentDetails: {
    duration: string;
  };
}

interface YouTubeApiResponse {
  items: YouTubeApiItem[];
}

const apiKey = env.get("YOUTUBE_API_KEY").required().asString();

router.use(
  "/parse",
  async (req: express.Request<unknown, unknown, unknown, ParseParams>, res) => {
    const type = req.query.type;
    const id = req.query.id;

    if (!type || !id) {
      return res.status(400).json({
        error: "No id, or no type provided.",
      });
    }

    if (type != "yt") {
      return res.status(400).json({
        error: "Invalid type",
      });
    }

    const response = (
      await axios.get<YouTubeApiResponse>(
        `https://www.googleapis.com/youtube/v3/videos?id=${id}&part=contentDetails,snippet&key=${apiKey}`
      )
    ).data;

    if (response.items.length == 0) {
      return res.status(400).json({
        error: "Invalid id",
      });
    }

    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    const checkForFailure = new Promise((resolve, reject) => {
      page.on("console", (msg) => {
        if (msg.text() == "SC01G1093AZ") {
          resolve(false);
        }
      });
      page
        .goto(`file://${__dirname}/../../pages/player.html?dt=${id}`)
        .then(() => {
          setTimeout(() => {
            resolve(true);
          }, 500);
        });
    });

    const canEmbed = await checkForFailure;

    const durationInSeconds = moment
      .duration(response.items[0].contentDetails.duration)
      .asSeconds();
    const title = response.items[0].snippet.title;
    const thumbnail = response.items[0].snippet.thumbnails.default.url;

    return res.json({
      durationInSeconds,
      title,
      thumbnail,
      canEmbed,
    });
  }
);

export default router;
