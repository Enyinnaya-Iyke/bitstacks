"use client";

import { useEffect, useRef, useState } from "react";
import { OTPInput, SlotProps } from "input-otp";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { authClient } from "@/lib/auth/auth-client";
import { toast } from "sonner";

type OtpDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    email: string;
};

export function OtpDialog({ open, onOpenChange, email }: OtpDialogProps) {
    const [value, setValue] = useState("");
    const [hasGuessed, setHasGuessed] = useState<undefined | boolean>(
        undefined,
    );
    const [loading, setLoading] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (hasGuessed) closeButtonRef.current?.focus();
    }, [hasGuessed]);

    async function onSubmit(e?: any) {
        e?.preventDefault?.();
        inputRef.current?.select();

        try {
            setLoading(true);
            const result = await authClient.signIn.emailOtp({
                email,
                otp: value,
            });

            authClient.$ERROR_CODES.ORGANIZATION_NOT_FOUND;
            if (result?.data) {
                setHasGuessed(true);

                const orgsResponse = await authClient.organization.list();
                if (orgsResponse?.data && orgsResponse.data.length > 0) {
                    const firstOrg = orgsResponse.data[0];
                    // Set the first organization as active
                    await authClient.organization.setActive({
                        organizationId: firstOrg.id,
                    });
                } else {
                    toast.error("No organizations found for the user.");
                }
            } else {
                setHasGuessed(false);
                toast.error("Invalid code. Please try again.");
            }
        } catch (err: any) {
            console.error(err);
            setHasGuessed(false);
            toast.error(err?.message || "Verification failed");
        } finally {
            setLoading(false);
            setValue("");
            setTimeout(() => inputRef.current?.blur(), 20);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <div className="flex flex-col items-center gap-2">
                    <div
                        className="flex size-11 shrink-0 items-center justify-center rounded-full border"
                        aria-hidden="true"
                    >
                        <svg
                            className="stroke-zinc-800 dark:stroke-zinc-100"
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 32 32"
                            aria-hidden="true"
                        >
                            <circle
                                cx="16"
                                cy="16"
                                r="12"
                                fill="none"
                                strokeWidth="8"
                            />
                        </svg>
                    </div>
                    <DialogHeader>
                        <DialogTitle className="sm:text-center">
                            {hasGuessed
                                ? "Code verified!"
                                : "Enter confirmation code"}
                        </DialogTitle>
                        <DialogDescription className="sm:text-center">
                            {hasGuessed
                                ? "Your code has been successfully verified."
                                : "Check your email and enter the code"}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                {hasGuessed ? (
                    <div className="text-center">
                        <DialogClose asChild>
                            <Button type="button" ref={closeButtonRef}>
                                Close
                            </Button>
                        </DialogClose>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex justify-center">
                            <OTPInput
                                id="confirmation-code"
                                ref={inputRef}
                                value={value}
                                onChange={setValue}
                                containerClassName="flex items-center gap-3 has-disabled:opacity-50"
                                maxLength={6}
                                onFocus={() => setHasGuessed(undefined)}
                                render={({ slots }) => (
                                    <div className="flex gap-2">
                                        {slots.map((slot, idx) => (
                                            // biome-ignore lint/suspicious/noArrayIndexKey: using index as key is acceptable here
                                            <Slot key={idx} {...slot} />
                                        ))}
                                    </div>
                                )}
                                onComplete={onSubmit}
                            />
                        </div>
                        {hasGuessed === false && (
                            <p
                                className="text-muted-foreground text-center text-xs"
                                role="alert"
                                aria-live="polite"
                            >
                                Invalid code. Please try again.
                            </p>
                        )}
                        <p className="text-center text-sm">
                            <button
                                className="underline hover:no-underline"
                                type="button"
                            >
                                Resend code
                            </button>
                        </p>
                        <div className="text-center">
                            <Button
                                type="button"
                                onClick={onSubmit}
                                disabled={loading || value.length < 4}
                            >
                                {loading ? "Verifying..." : "Verify"}
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

function Slot(props: SlotProps) {
    return (
        <div
            className={cn(
                "border-input bg-background text-foreground flex size-9 items-center justify-center rounded-md border font-medium shadow-xs transition-[color,box-shadow]",
                { "border-ring ring-ring/50 z-10 ring-[3px]": props.isActive },
            )}
        >
            {props.char !== null && <div>{props.char}</div>}
        </div>
    );
}
