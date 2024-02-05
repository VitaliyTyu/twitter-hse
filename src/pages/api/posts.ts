import { Post } from "@prisma/client";
import { PrismaClient } from "@prisma/client";
import { NextApiRequest, NextApiResponse } from "next";
import prisma from "~/lib/prisma";

export default async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    if (req.method === "GET") {
      const posts = await prisma.post.findMany();
      res.status(200).json(posts);
    } else if (req.method === "POST") {
      const post = JSON.parse(req.body);
      const dbResp = await prisma.post.create({
        data: {
          ...post,
          authorId: "28f1e4f4-f9d8-4f43-85ee-37d590ad005e",
        },
      });

      return res.status(201).json(dbResp);
    } else {
      return res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error) {
    console.error("Error fetching posts", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
