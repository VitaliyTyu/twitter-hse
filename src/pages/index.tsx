import { SignInButton, useUser } from "@clerk/nextjs";
import { LoadingPage } from "~/components/LoadingPage";
import { api } from "~/utils/api";
import { CreatePostWizard } from "~/components/CreatePostWizard";
import { PostView } from "~/components/PostView";

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
