import { Form, Head, usePage } from '@inertiajs/react';
import { Link } from '@inertiajs/react';
import { Camera, Trash2 } from 'lucide-react';
import { useState } from 'react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useInitials } from '@/hooks/use-initials';
import { edit } from '@/routes/profile';
import { send } from '@/routes/verification';
import type { Auth } from '@/types';

type PageProps = {
    auth: Auth;
};

export default function Profile({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { auth } = usePage<PageProps>().props;
    const getInitials = useInitials();
    const [avatarPreview, setAvatarPreview] = useState(auth.user.avatar);

    return (
        <>
            <Head title="Profile settings" />

            <h1 className="sr-only">Profile settings</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Profile picture"
                    description="Upload a JPG, PNG, or WebP image up to 2 MB"
                />

                <div className="flex flex-col gap-5 rounded-xl border bg-card p-5 sm:flex-row sm:items-center">
                    <Avatar className="size-24 border-4 border-background shadow-md">
                        <AvatarImage
                            src={avatarPreview}
                            alt={auth.user.name}
                            className="object-cover"
                        />
                        <AvatarFallback className="bg-primary text-xl text-primary-foreground">
                            {getInitials(auth.user.name)}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 space-y-3">
                        <Form
                            {...ProfileController.updatePhoto.form()}
                            options={{ preserveScroll: true }}
                            resetOnSuccess
                            className="flex flex-wrap items-start gap-3"
                        >
                            {({ processing, errors }) => (
                                <>
                                    <div className="grid gap-2">
                                        <Input
                                            id="avatar"
                                            name="avatar"
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            required
                                            className="max-w-sm"
                                            onChange={(event) => {
                                                const file =
                                                    event.target.files?.[0];

                                                if (!file) {
                                                    return;
                                                }

                                                const reader = new FileReader();
                                                reader.onload = () =>
                                                    setAvatarPreview(
                                                        String(reader.result),
                                                    );
                                                reader.readAsDataURL(file);
                                            }}
                                        />
                                        <InputError message={errors.avatar} />
                                    </div>
                                    <Button disabled={processing}>
                                        <Camera />
                                        {processing ? 'Uploading...' : 'Upload'}
                                    </Button>
                                </>
                            )}
                        </Form>

                        {auth.user.avatar && (
                            <Form
                                {...ProfileController.destroyPhoto.form()}
                                options={{ preserveScroll: true }}
                            >
                                {({ processing }) => (
                                    <Button
                                        type="submit"
                                        variant="ghost"
                                        size="sm"
                                        disabled={processing}
                                        className="text-destructive hover:text-destructive"
                                    >
                                        <Trash2 />
                                        Remove picture
                                    </Button>
                                )}
                            </Form>
                        )}
                    </div>
                </div>

                <Heading
                    variant="small"
                    title="Profile"
                    description="Update your name and email address"
                />

                <Form
                    {...ProfileController.update.form()}
                    options={{
                        preserveScroll: true,
                    }}
                    className="space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="name">Name</Label>

                                <Input
                                    id="name"
                                    className="mt-1 block w-full"
                                    defaultValue={auth.user.name}
                                    name="name"
                                    required
                                    autoComplete="name"
                                    placeholder="Full name"
                                />

                                <InputError
                                    className="mt-2"
                                    message={errors.name}
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>

                                <Input
                                    id="email"
                                    type="email"
                                    className="mt-1 block w-full"
                                    defaultValue={auth.user.email}
                                    name="email"
                                    required
                                    autoComplete="username"
                                    placeholder="Email address"
                                />

                                <InputError
                                    className="mt-2"
                                    message={errors.email}
                                />
                            </div>

                            {mustVerifyEmail &&
                                auth.user.email_verified_at === null && (
                                    <div>
                                        <p className="-mt-4 text-sm text-muted-foreground">
                                            Your email address is unverified.{' '}
                                            <Link
                                                href={send()}
                                                as="button"
                                                className="text-foreground underline decoration-neutral-300 underline-offset-4 transition-colors duration-300 ease-out hover:decoration-current! dark:decoration-neutral-500"
                                            >
                                                Click here to re-send the
                                                verification email.
                                            </Link>
                                        </p>

                                        {status ===
                                            'verification-link-sent' && (
                                            <div className="mt-2 text-sm font-medium text-green-600">
                                                A new verification link has been
                                                sent to your email address.
                                            </div>
                                        )}
                                    </div>
                                )}

                            <div className="flex items-center gap-4">
                                <Button
                                    disabled={processing}
                                    data-test="update-profile-button"
                                >
                                    Save
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>

            <DeleteUser />
        </>
    );
}

Profile.layout = {
    breadcrumbs: [
        {
            title: 'Profile settings',
            href: edit(),
        },
    ],
};
