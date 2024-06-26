import { UserButton, useUser } from "@clerk/nextjs";
import { useState } from "react";
import toast from "react-hot-toast";
import { api } from "~/utils/api";

export const CreatePostWizard = () => {
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
            const zodErrorMessage = e.data?.zodError?.fieldErrors?.content?.[0];
            if (zodErrorMessage) {
                toast.error(zodErrorMessage);
            } else {
                toast.error(e.message);
            }
        },
    });

    if (!user) return null;

    return (
        <div className="flex w-full gap-3 items-center p-4 bg-gray-500 rounded-lg border border-gray-800">
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
                className="w-full bg-transparent outline-none text-white placeholder-white-800"
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
            />
            {input !== "" && !createPost.isPending && (
                <button
                    onClick={() => {
                        createPost.mutate({ content: input });
                    }}
                    className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-600"
                >
                    Post
                </button>
            )}
        </div>

    );
};
