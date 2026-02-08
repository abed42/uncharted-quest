import { Poppins } from "next/font/google";
import type { ReactNode } from "react";

type AuthLayoutProps = {
  readonly children: ReactNode;
};

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["600", "700"],
});

const AuthLayout = ({ children }: AuthLayoutProps) => (
  <div className="container relative grid h-dvh flex-col items-center justify-center lg:max-w-none lg:grid-cols-2 lg:px-0">
    <div className="relative hidden h-full flex-col overflow-hidden bg-muted p-10 text-white lg:flex dark:border-r">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/auth.png')" }}
      />
      <div
        className={`${poppins.className} relative z-20 flex items-center text-xl font-bold tracking-tight text-white`}
      >
        uncharted.quest
      </div>
      {/* <div className="absolute top-4 right-4">
        <ModeToggle />
      </div> */}
      <div className="relative z-20 mt-auto text-primary">
        <blockquote className="space-y-2">
          <p className="text-lg">
            Turn rough ideas into investor-ready decks with an agent that ships live presentation, that are ready to share.
          </p>
        </blockquote>
      </div>
    </div>
    <div className="lg:p-8">
      <div className="mx-auto flex w-full max-w-[400px] flex-col justify-center space-y-6">
        {children}
      </div>
    </div>
  </div>
);

export default AuthLayout;
