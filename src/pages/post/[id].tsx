import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { useState } from "react";
import toast from "react-hot-toast";
import { CommentView } from "~/components/CommentView";
import { PageLayout } from "~/components/PageLayout";
import { PostView } from "~/components/PostView";
import { generateSSGHelper } from "~/server/helpers/ssgHelper";
import { api } from "~/utils/api";

const SinglePostPage: NextPage<{ id: string }> = ({ id }) => {
  const [input, setInput] = useState("");
  const { data } = api.posts.getById.useQuery({
    id,
  });

  const utils = api.useUtils();

  const createComment = api.posts.addComment.useMutation({
    onSuccess: async () => {
      setInput("");
      await utils.posts.invalidate();
    },
    onError: (e) => {
      const zodErrorMessage = e.data?.zodError?.fieldErrors?.content?.[0];
      if (zodErrorMessage) {
        toast.error(zodErrorMessage);
      } else {
        toast.error(e.message);
      }
    },
  });

  if (!data) return <div>404</div>;

  return (
    <>
      <Head>
        <title>{`${data.post.content} - @${data.author.username}`}</title>
      </Head>
      <PageLayout>
        <PostView {...data} />
        {data.comments.map((comment) => (
          <CommentView
            author={comment.author}
            content={comment.content}
            createdAt={comment.createdAt}
            key={comment.id}
          />
        ))}
        <input
          type="text"
          className={
            "border-gray absolute bottom-0 w-full border-t bg-transparent p-3"
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Write a comment..."
          onKeyDown={(e) => {
            if (input !== "" && e.key === "Enter") {
              e.preventDefault();
              createComment.mutate({ content: input, postId: id });
            }
          }}
        />
      </PageLayout>
    </>
  );
};

export const getStaticProps: GetStaticProps = async (context) => {
  const ssg = generateSSGHelper();

  const id = context.params?.id;

  if (typeof id !== "string") throw new Error("no id");

  await ssg.posts.getById.prefetch({ id });

  return {
    props: {
      trpcState: ssg.dehydrate(),
      id,
    },
  };
};

export const getStaticPaths = () => {
  return { paths: [], fallback: "blocking" };
};

export default SinglePostPage;
