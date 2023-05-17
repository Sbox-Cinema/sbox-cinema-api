import express from "express";
import moment from "moment";
import axios from "axios";
import { ParseParams, YouTubeApiResponse, apiKey } from "./parse-v1";

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const parseV2 = async (
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
  const blockedRegions =
    response.items[0].contentDetails.regionRestriction?.blocked?.length ?? 0;

  const canEmbed = blockedRegions == 0;

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
