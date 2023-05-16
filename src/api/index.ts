import express from "express";
import got from "got";
import moment from "moment";
import * as env from "env-var";

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
            }
        }
    };
    contentDetails: {
        duration: string;
    }
}

interface YouTubeApiResponse {
    items: YouTubeApiItem[]
}

const apiKey = env.get("YOUTUBE_API_KEY").required().asString();

router.use("/parse", async (req : express.Request<{}, {}, {}, ParseParams>, res) => {
    const type = req.query.type;
    const id = req.query.id;

    if (!type || !id) {
        return res.status(400).json({
            error: "No id, or no type provided."
        });
    }

    if (type != "yt") {
        return res.status(400).json({
            error: "Invalid type"
        });
    }

    const response = await got.get(`https://www.googleapis.com/youtube/v3/videos?id=${id}&part=contentDetails,snippet&key=${apiKey}`).json<YouTubeApiResponse>();

    if (response.items.length == 0) {
        return res.status(400).json({
            error: "Invalid id"
        });
    }

    const durationInSeconds = moment.duration(response.items[0].contentDetails.duration).asSeconds();
    const title = response.items[0].snippet.title;
    const thumbnail = response.items[0].snippet.thumbnails.default.url;

    return res.json({
        durationInSeconds,
        title,
        thumbnail
    });
});

export default router;
