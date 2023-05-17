import express from "express";
import moment from "moment";
import * as env from "env-var";
import axios from "axios";
import puppeteer from "puppeteer";
import { Maybe } from "../util";

export const apiKey = env.get("YOUTUBE_API_KEY").required().asString();
const PORT: number = env.get("PORT").default("5000").asPortNumber();

export interface YouTubeApiItem {
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
    regionRestriction: Maybe<{
      blocked: Maybe<string[]>;
    }>;
  };
}

export interface YouTubeApiResponse {
  items: YouTubeApiItem[];
}

export interface ParseParams {
  type: string;
  id: string;
}

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const parseV1 = async (
  req: express.Request<unknown, unknown, unknown, ParseParams>,
  res: express.Response
) => {
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
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  const checkForFailure = new Promise((resolve, reject) => {
    page.on("console", (msg) => {
      if (msg.text() == "SC01G1093AZ") {
        resolve(false);
      }
    });
    const playerUrl = `http://localhost:${PORT}/player.html?dt=${id}`;
    console.info(`goto: ${playerUrl}`);
    page
      .goto(playerUrl)
      .then(() => {
        setTimeout(() => {
          resolve(true);
        }, 500);
      })
      .catch((err) => {
        console.error(`pe: ${err}`);
        reject(err);
      });
  });

  let canEmbed;

  try {
    canEmbed = await checkForFailure;
  } catch (err) {
    console.error(err);
    await browser.close();

    return res.status(500).send();
  }

  await browser.close();

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
};
