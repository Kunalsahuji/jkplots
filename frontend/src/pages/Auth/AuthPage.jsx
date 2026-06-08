import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Home, Phone, ArrowRight, ArrowLeft, Lock, User, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import api from '@/utils/api';

// ─── Zod Schemas ─────────────────────────────────────────────────────────────

const step1Schema = z.object({
    name: z
        .string()
        .trim()
        .min(2, 'Name must be at least 2 characters')
        .max(60, 'Name cannot exceed 60 characters')
        .regex(/^[A-Za-z\s]+$/, 'Name must contain only letters and spaces'),
    phone: z
        .string()
        .trim()
        .regex(/^\d{10}$/, 'Enter a valid 10-digit mobile number'),
    role: z.enum(['user', 'dealer']).default('user'),
});

const step2Schema = z.object({
    otp: z
        .string()
        .trim()
        .regex(/^\d{6}$/, 'OTP must be exactly 6 digits'),
});

// ─── Reusable inline field components ─────────────────────────────────────────

function FieldError({ message }) {
    if (!message) return null;
    return (
        <p role="alert" className="mt-1 flex items-center gap-1 text-xs text-destructive">
            <span className="h-3 w-3 shrink-0">⚠</span> {message}
        </p>
    );
}

function InputWrapper({ error, children }) {
    return (
        <label
            className={`flex items-center gap-2 rounded-xl border bg-background px-4 py-3 transition-colors focus-within:ring-2 focus-within:ring-ring/30 ${
                error
                    ? 'border-destructive focus-within:border-destructive'
                    : 'border-border focus-within:border-primary'
            }`}
        >
            {children}
        </label>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AuthPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { login } = useAuth();

    const [step, setStep] = useState(1);
    const [phone, setPhone] = useState(''); // carry phone between steps
    const [name, setName] = useState('');   // carry name between steps
    const [role, setRole] = useState('user'); // carry role between steps
    const [serverError, setServerError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ─── Step 1 form ─────────────────────────────────────────────────────────
    const {
        register: reg1,
        handleSubmit: handle1,
        watch: watch1,
        formState: { errors: err1 },
        setValue: setValue1,
    } = useForm({
        resolver: zodResolver(step1Schema),
        defaultValues: { name: '', phone: '', role: 'user' },
        mode: 'onBlur', // Validate on blur for UX, on submit for completeness
    });

    const isDealer = watch1('role') === 'dealer';
    const toggleDealer = () => setValue1('role', isDealer ? 'user' : 'dealer', { shouldValidate: true });

    // ─── Step 2 form ─────────────────────────────────────────────────────────
    const {
        register: reg2,
        handleSubmit: handle2,
        formState: { errors: err2 },
    } = useForm({
        resolver: zodResolver(step2Schema),
        defaultValues: { otp: '' },
        mode: 'onBlur',
    });

    // ─── Step 1: Send OTP ─────────────────────────────────────────────────────
    const onSendOtp = async (values) => {
        setServerError('');
        setIsSubmitting(true);
        try {
            await api.post('/users/send-otp', values);
            setPhone(values.phone);
            setName(values.name);
            setRole(values.role);
            setStep(2);
        } catch (err) {
            const data = err.response?.data;
            // Field-level server errors (from express-validator)
            if (data?.errors) {
                setServerError(data.errors.map((e) => e.message).join(' · '));
            } else {
                setServerError(data?.error || 'Something went wrong. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // ─── Step 2: Verify OTP → Login ───────────────────────────────────────────
    const onVerifyOtp = async (values) => {
        setServerError('');
        setIsSubmitting(true);
        try {
            const { data } = await api.post('/users/verify-otp', { phone, otp: values.otp });
            if (data.success) {
                login(data.data);
                const redirectUrl = searchParams.get('redirect') || '/';
                navigate(redirectUrl, { replace: true });
            }
        } catch (err) {
            const data = err.response?.data;
            setServerError(data?.error || 'OTP verification failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container-px mx-auto grid min-h-screen max-w-7xl gap-8 py-12 lg:grid-cols-2 lg:items-center">

            {/* ── Left Panel (desktop only) ─────────────────────────────────── */}
            <div className="hidden rounded-3xl bg-gradient-hero p-12 text-primary-foreground lg:block">
                <Link to="/" className="inline-block transition-transform hover:scale-105">
                    <Home className="h-10 w-10 text-accent" />
                </Link>
                <h2 className="mt-6 font-display text-4xl font-bold leading-tight">
                    Welcome to J&K's<br />property home.
                </h2>
                <p className="mt-4 max-w-md text-background/80">
                    Save favorite listings, get instant alerts, chat with verified dealers — all in one place.
                </p>
                <ul className="mt-8 space-y-3 text-sm">
                    {[
                        'Verified dealer network',
                        'Instant WhatsApp connect',
                        'Smart price alerts',
                        'Save and compare',
                    ].map((f) => (
                        <li key={f} className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-accent shrink-0" /> {f}
                        </li>
                    ))}
                </ul>

                {/* Step indicator */}
                <div className="mt-10 flex items-center gap-3">
                    <div className={`h-2 w-8 rounded-full transition-all ${step >= 1 ? 'bg-accent' : 'bg-background/30'}`} />
                    <div className={`h-2 w-8 rounded-full transition-all ${step >= 2 ? 'bg-accent' : 'bg-background/30'}`} />
                    <span className="text-xs text-background/60">Step {step} of 2</span>
                </div>
            </div>

            {/* ── Right Panel: Form ─────────────────────────────────────────── */}
            <div className="mx-auto w-full max-w-md">
                <div className="mb-4 text-left">
                    <Link
                        to="/"
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition hover:text-primary"
                    >
                        <ArrowLeft className="h-4 w-4" /> Back to Home
                    </Link>
                </div>

                <div className="rounded-3xl border border-border bg-card p-8 shadow-card">
                    {/* ── Header ───────────────────────────────────────────── */}
                    <div className="mb-6">
                        <div className="flex items-center gap-2 mb-1">
                            <ShieldCheck className="h-5 w-5 text-primary" />
                            <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                                {step === 1 ? 'Create / Sign In' : 'Verify OTP'}
                            </span>
                        </div>
                        <h1 className="font-display text-2xl font-bold">
                            {step === 1 ? 'Sign in to JKPLOT' : 'Enter your OTP'}
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {step === 1
                                ? 'Enter your details to continue'
                                : `OTP sent to +91 ${phone}`}
                        </p>
                    </div>

                    {/* ── Server-level error (not field-level) ─────────────── */}
                    {serverError && (
                        <div
                            role="alert"
                            className="mb-4 rounded-xl border border-destructive/20 bg-destructive/8 px-4 py-3 text-sm text-destructive"
                        >
                            {serverError}
                        </div>
                    )}

                    {/* ── Step 1: Name + Phone ──────────────────────────────── */}
                    {step === 1 && (
                        <form onSubmit={handle1(onSendOtp)} noValidate className="space-y-4">

                            {/* Name */}
                            <div>
                                <InputWrapper error={err1.name}>
                                    <User className="h-4 w-4 shrink-0 text-muted-foreground" />
                                    <input
                                        {...reg1('name', {
                                            onChange: (e) => {
                                                e.target.value = e.target.value.replace(/[^A-Za-z\s]/g, '');
                                            },
                                        })}
                                        type="text"
                                        placeholder="Full name"
                                        autoComplete="name"
                                        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                                    />
                                </InputWrapper>
                                <FieldError message={err1.name?.message} />
                            </div>

                            {/* Phone */}
                            <div>
                                <InputWrapper error={err1.phone}>
                                    <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">+91</span>
                                    <input
                                        {...reg1('phone', {
                                            onChange: (e) => {
                                                // Allow only digits, max 10
                                                e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10);
                                            },
                                        })}
                                        type="tel"
                                        inputMode="numeric"
                                        maxLength={10}
                                        placeholder="10-digit mobile number"
                                        autoComplete="tel"
                                        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
                                    />
                                </InputWrapper>
                                <FieldError message={err1.phone?.message} />
                            </div>

                            {/* Dealer toggle */}
                            <div
                                onClick={toggleDealer}
                                className={`flex cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 transition-colors ${
                                    isDealer ? 'border-primary bg-primary-soft' : 'border-border bg-background hover:border-primary/40'
                                }`}
                            >
                                <input
                                    type="checkbox"
                                    id="dealerToggle"
                                    checked={isDealer}
                                    readOnly
                                    className="mt-0.5 h-4 w-4 rounded border-border accent-primary pointer-events-none"
                                />
                                <label htmlFor="dealerToggle" className="cursor-pointer select-none">
                                    <p className="text-sm font-medium">I'm a Dealer / Agent</p>
                                    <p className="text-xs text-muted-foreground">Post and manage property listings</p>
                                </label>
                            </div>

                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full gap-2 rounded-xl bg-primary py-6 text-base font-semibold"
                            >
                                {isSubmitting ? 'Sending OTP…' : 'Continue'}
                                <ArrowRight className="h-4 w-4" />
                            </Button>
                        </form>
                    )}

                    {/* ── Step 2: OTP ───────────────────────────────────────── */}
                    {step === 2 && (
                        <form onSubmit={handle2(onVerifyOtp)} noValidate className="space-y-4">

                            <div className="flex items-center justify-between px-1">
                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                    OTP Code
                                </span>
                                <button
                                    type="button"
                                    onClick={() => { setStep(1); setServerError(''); }}
                                    className="text-xs font-bold text-primary hover:underline"
                                >
                                    Change number
                                </button>
                            </div>

                            <div>
                                <InputWrapper error={err2.otp}>
                                    <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
                                    <input
                                        {...reg2('otp', {
                                            onChange: (e) => {
                                                e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6);
                                            },
                                        })}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={6}
                                        placeholder="000000"
                                        autoComplete="one-time-code"
                                        className="flex-1 bg-transparent text-center text-lg font-bold tracking-[0.5em] outline-none placeholder:text-muted-foreground/40 placeholder:tracking-normal"
                                    />
                                </InputWrapper>
                                <FieldError message={err2.otp?.message} />
                            </div>

                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full gap-2 rounded-xl bg-primary py-6 text-base font-semibold"
                            >
                                {isSubmitting ? 'Verifying…' : 'Verify & Continue'}
                                <ArrowRight className="h-4 w-4" />
                            </Button>

                            <p className="text-center text-xs text-muted-foreground">
                                Didn't receive?{' '}
                                <button
                                    type="button"
                                    onClick={() => onSendOtp({ name, phone, role })}
                                    className="font-semibold text-primary hover:underline"
                                >
                                    Resend OTP
                                </button>
                            </p>
                        </form>
                    )}

                    <p className="mt-6 text-center text-xs text-muted-foreground">
                        By continuing you agree to our{' '}
                        <Link to="/" className="text-primary hover:underline">Terms</Link>{' '}
                        &{' '}
                        <Link to="/" className="text-primary hover:underline">Privacy</Link>.
                    </p>
                </div>
            </div>
        </div>
    );
}
