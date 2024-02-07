import { SignInButton, useUser } from "@clerk/nextjs";
import { LoadingPage } from "~/components/LoadingPage";
import { api } from "~/utils/api";
import { CreatePostWizard } from "~/components/CreatePostWizard";
import { PostView } from "~/components/PostView";
import { PageLayout } from "~/components/PageLayout";

const Feed = () => {
  const postsQuery = api.posts.getAll.useQuery();

  if (postsQuery.isLoading) return <LoadingPage />;

  if (!postsQuery.data) return <div>Something went wrong</div>;

  return (
    <div className="flex grow flex-col overflow-y-scroll">
      {postsQuery.data?.map((fullPost) => (
        <PostView {...fullPost} key={fullPost.post.id} />
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
    <PageLayout>
      <div className="flex items-center gap-3 border border-b border-slate-400 p-4">
        {!isSignedIn && (
          <div className="flex justify-center">
            <SignInButton />
          </div>
        )}
        {isSignedIn && <CreatePostWizard />}
      </div>
      <Feed />
    </PageLayout>
  );
}
