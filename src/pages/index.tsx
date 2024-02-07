/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import Image from "next/image";
import { useState } from "react";
import toast from "react-hot-toast";
import { LoadingPage } from "~/components/LoadingPage";
import { type RouterOutputs, api } from "~/utils/api";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);

type PostWithUser = RouterOutputs["posts"]["getAll"][number];
const PostView = ({ post, author }: PostWithUser) => {
  return (
    <div className="flex items-center gap-3 border border-x-2 border-b-2 border-slate-200 p-4">
      <div className="float-start flex h-full flex-col">
        <Image
          className="min-h-14 min-w-14 rounded-full"
          src={author.imageUrl}
          alt={`@${author.username}'s profile picture`}
          height={56}
          width={56}
        />
      </div>

      <div className="flex flex-col">
        <div className="flex">
          <span>{`@${author.username}`}</span>
          &nbsp;
          <span className="font-thin">{`· ${dayjs(
            post.createdAt,
          ).fromNow()}`}</span>
        </div>
        <span className="overflow-anywhere">{post.content}</span>
      </div>
    </div>
  );
};

const CreatePostWizard = () => {
  const { user } = useUser();

  const [input, setInput] = useState("");

  const utils = api.useUtils();

  const createPost = api.posts.create.useMutation({
    onSuccess: async () => {
      setInput("");

      // refech posts
      await utils.posts.invalidate();
    },
    onError: (e) => {
      toast.error(e.message);
    },
  });

  if (!user) return null;

  return (
    <div className="flex w-full grow gap-3">
      <UserButton
        appearance={{
          elements: {
            userButtonAvatarBox: {
              width: 56,
              height: 56,
            },
          },
        }}
      />
      <input
        type="text"
        className="w-full grow bg-transparent outline-none"
        placeholder="Type some text"
        value={input}
        disabled={createPost.isPending}
        onChange={(e) => {
          setInput(e.target.value);
        }}
        onKeyDown={(e) => {
          if (input !== "" && e.key === "Enter") {
            e.preventDefault();
            createPost.mutate({ content: input });
          }
        }}
      ></input>
      {input !== "" && !createPost.isPending && (
        <button
          onClick={() => {
            createPost.mutate({ content: input });
          }}
          className="p-4"
        >
          Post
        </button>
      )}
    </div>
  );
};

const Feed = () => {
  const postsQuery = api.posts.getAll.useQuery();

  if (postsQuery.isLoading) return <LoadingPage />;

  if (!postsQuery.data) return <div>Something went wrong</div>;

  return (
    <div className="flex grow flex-col">
      {postsQuery.data?.map((fullPost, index) => (
        <PostView {...fullPost} key={index} />
      ))}
    </div>
  );
};

export default function Home() {
  const { isLoaded: userLoaded, isSignedIn } = useUser();

  // prefech, to get data from cache after
  api.posts.getAll.useQuery();

  if (!userLoaded) return <div></div>;

  return (
    <>
      <main className="flex h-full w-full justify-center">
        <div className="flex w-full justify-center bg-gradient-to-b from-[#d6b6ff9d] to-[#3842ff6c]">
          <div className="flex h-full w-full flex-col border-x-2 border-slate-200 md:max-w-2xl">
            <div className="flex items-center gap-3 border border-b-2 border-slate-200 p-4">
              {!isSignedIn && (
                <div className="flex justify-center">
                  <SignInButton />
                </div>
              )}
              {isSignedIn && <CreatePostWizard />}
            </div>
            <Feed />
          </div>
        </div>
      </main>
    </>
  );
}
