"use client";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Loader2, Wallet2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { authClient } from "@/lib/auth/auth-client";
import { toast } from "sonner";
import { OtpDialog } from "./otp";

const formSchema = z.object({
    email: z.string().email({
        message: "Please enter a valid email address.",
    }),
});

export function LoginForm({
    className,
    ...props
}: React.ComponentProps<"div">) {
    const [isLoading, setIsLoading] = useState(false);
    const [showOtp, setShowOtp] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: { email: "" },
    });

    const handleSignInWithEmail = async (
        values: z.infer<typeof formSchema>,
    ) => {
        try {
            await authClient.emailOtp.sendVerificationOtp(
                {
                    email: values.email,
                    type: "sign-in",
                },
                {
                    onRequest: () => setIsLoading(true),
                    onSuccess: () => {
                        setShowOtp(true);
                    },
                    onResponse: () => {
                        setIsLoading(false);
                    },
                    onError: async (ctx) => {
                        setIsLoading(false);
                        console.error(ctx.error);
                        toast.error(ctx.error.message);
                    },
                },
            );
        } catch (err) {
            setIsLoading(false);
            console.error(err);
        }
    };

    return (
        <>
            <div className={cn("flex flex-col gap-6", className)} {...props}>
                <div className="flex flex-col items-center gap-2 text-center">
                    <h1 className="text-2xl font-bold">
                        Login to your account
                    </h1>
                    <p className="text-muted-foreground text-sm text-balance">
                        Enter your email below to login to your account
                    </p>
                </div>

                <Form {...form}>
                    <form
                        onSubmit={form.handleSubmit(handleSignInWithEmail)}
                        className="grid gap-6"
                    >
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="email"
                                            placeholder="m@example.com"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isLoading}
                        >
                            {isLoading && <Loader2 />}
                            {isLoading ? "Signing in..." : "Login with email"}
                        </Button>
                    </form>
                </Form>

                <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                    <span className="bg-background text-muted-foreground relative z-10 px-2">
                        Or continue with
                    </span>
                </div>

                <Button variant="outline" className="w-full bg-transparent">
                    <Wallet2 />
                    Continue with wallet
                </Button>

                {/*<div className="text-center text-sm">
                    {"Don't have an account? "}
                    <a href="#" className="underline underline-offset-4">
                        Sign up
                    </a>
                </div>*/}
            </div>

            <OtpDialog
                email={form.getValues().email}
                open={showOtp}
                onOpenChange={setShowOtp}
            />
        </>
    );
}
