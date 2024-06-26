import type { PropsWithChildren } from "react";

export const PageLayout = (props: PropsWithChildren) => {
    return (
        <main className="overflow-hidden flex h-screen justify-center bg-blue-100">
            <div className="flex h-full w-full flex-col border-x border-slate-400 md:max-w-2xl">
                {props.children}
            </div>
        </main>

    );
};
