import type { NextPage } from "next";
import { PageLayout } from "~/components/PageLayout";

const PostPage: NextPage<{ id: string }> = ({ id }) => {
  return <PageLayout>Post Page</PageLayout>;
};

export default PostPage;
