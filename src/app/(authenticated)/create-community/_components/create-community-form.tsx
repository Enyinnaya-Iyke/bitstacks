"use client";
import type React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { NFTCollection } from "@/types/nft";
import { authClient } from "@/lib/auth/auth-client";
import { slugify } from "@/lib/utils/text";
import { toast } from "sonner";

const formSchema = z.object({
    logo: z.string().min(1, "Logo is required"),
    name: z.string().min(2, "Name must be at least 2 characters"),
    description: z
        .string()
        .min(10, "Description must be at least 10 characters"),
    contractAddress: z.string().min(1, "Please select an NFT"),
});

export default function CreateCommunityForm({
    collections,
}: {
    collections: NFTCollection[];
}) {
    const [logoPreview, setLogoPreview] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const [selectedNFT, setSelectedNFT] = useState<string>("");

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            logo: "",
            name: "",
            description: "",
            contractAddress: "",
        },
    });

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                setLogoPreview(result);
                form.setValue("logo", result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleNFTSelect = (nft: NFTCollection) => {
        setSelectedNFT(nft.id);
        form.setValue("contractAddress", nft.id);
    };

    async function onSubmit(values: z.infer<typeof formSchema>) {
        console.log(values);
        try {
            await authClient.organization.create(
                {
                    name: values.name,
                    slug: slugify(values.name),
                    keepCurrentActiveOrganization: false,
                    contractAddress: values.contractAddress,
                    public: true,
                },
                {
                    onRequest: () => setIsLoading(true),
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
            console.error(err);
        }
    }

    return (
        <div className="mx-auto p-6 space-y-8">
            <Form {...form}>
                <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-8 flex gap-8"
                >
                    <div className="flex-1">
                        {/* NFT Collection Selection */}
                        <FormField
                            control={form.control}
                            name="contractAddress"
                            render={() => (
                                <FormItem className="mb-8">
                                    <FormLabel>Select NFT Collection</FormLabel>
                                    <FormDescription>
                                        Choose a collection you own
                                    </FormDescription>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mt-4">
                                        {collections.map((nft) => {
                                            const isVideo = nft.image
                                                ?.toLowerCase()
                                                .endsWith(".mp4");

                                            return (
                                                <Card
                                                    key={nft.id}
                                                    className={`cursor-pointer transition-all hover:shadow-lg ${
                                                        selectedNFT === nft.id
                                                            ? "ring-2 ring-primary shadow-lg"
                                                            : ""
                                                    }`}
                                                    onClick={() =>
                                                        handleNFTSelect(nft)
                                                    }
                                                >
                                                    <CardContent className="p-2">
                                                        <div className="aspect-square mb-1 rounded-md overflow-hidden">
                                                            {isVideo ? (
                                                                <video
                                                                    src={
                                                                        nft.image ||
                                                                        ""
                                                                    }
                                                                    className="w-full h-full object-cover"
                                                                    autoPlay
                                                                    loop
                                                                    muted
                                                                    playsInline
                                                                />
                                                            ) : (
                                                                <img
                                                                    src={
                                                                        nft.image ||
                                                                        "/placeholder.svg"
                                                                    }
                                                                    alt={
                                                                        nft.name ||
                                                                        "NFT Collection"
                                                                    }
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            )}
                                                        </div>

                                                        <h3 className="font-semibold text-[10px] truncate">
                                                            {nft.name ||
                                                                "Unnamed Collection"}
                                                        </h3>

                                                        <p className="text-[9px] text-muted-foreground truncate">
                                                            {nft.id.slice(0, 6)}
                                                            ...
                                                            {nft.id.slice(-4)}
                                                        </p>
                                                    </CardContent>
                                                </Card>
                                            );
                                        })}
                                    </div>

                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="flex-1 space-y-6">
                        {/* Logo Upload */}
                        <FormField
                            control={form.control}
                            name="logo"
                            render={() => (
                                <FormItem>
                                    <FormLabel>Logo</FormLabel>
                                    <FormControl>
                                        <div className="space-y-4">
                                            <Input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                                className="cursor-pointer"
                                            />
                                            {logoPreview && (
                                                <div className="flex justify-center">
                                                    <img
                                                        src={
                                                            logoPreview ||
                                                            "/placeholder.svg"
                                                        }
                                                        alt="Logo preview"
                                                        className="max-w-xs max-h-48 object-contain rounded-lg border"
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </FormControl>
                                    <FormDescription>
                                        Upload your project logo (PNG, JPG, or
                                        GIF)
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Name Field */}
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Enter project name"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        The name of your NFT project
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Description Field */}
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Describe your project..."
                                            className="min-h-[100px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        A detailed description of your NFT
                                        project
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <Button type="submit" className="w-full">
                            Submit
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
