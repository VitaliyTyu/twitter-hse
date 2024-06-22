import { LoadingPage } from "~/components/LoadingPage";
import { api } from "~/utils/api";
import { PostView } from "~/components/PostView";
import { useUser } from "@clerk/nextjs";

interface FeedForFollowedUsersProps {
    skip: number;
    take: number;
}

const FeedForFollowedUsers = ({ skip, take }: FeedForFollowedUsersProps) => {
    const { user } = useUser();
    const userId = user?.id;

    const { data: postsData, isLoading } = api.posts.getPostsByFollowedUsers.useQuery({
        userId: userId!,
        skip,
        take,
    }, {
        enabled: !!userId,
    });

    if (isLoading) return <LoadingPage />;

    if (!postsData || postsData.length === 0) {
        return <div>No posts available</div>;
    }

    return (
        <div className="flex grow flex-col overflow-y-auto">
            {postsData.map((fullPost) => (
                <PostView {...fullPost} key={fullPost.post.id} />
            ))}
            {postsData.length < take && (
                <div className="flex justify-center text-gray-500 my-4">End of posts</div>
            )}
        </div>
    );
};

export default FeedForFollowedUsers;
