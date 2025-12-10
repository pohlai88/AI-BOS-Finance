import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Shield,
  Lock,
  Eye,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Database,
  Cloud,
  Server,
} from 'lucide-react';

interface BYOFOnboardingProps {
  onComplete: () => void;
  onBack: () => void;
}

type Step = 'trust' | 'storage' | 'connect' | 'processing';

export const BYOFOnboarding = ({ onComplete, onBack }: BYOFOnboardingProps) => {
  const [currentStep, setCurrentStep] = useState<Step>('trust');

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-20">
      <div className="w-full max-w-5xl">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="mb-8 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to overview</span>
        </button>

        {/* Progress Indicator */}
        <ProgressBar currentStep={currentStep} />

        {/* Step Content */}
        <AnimatePresence mode="wait">
          {currentStep === 'trust' && (
            <TrustStep key="trust" onNext={() => setCurrentStep('storage')} />
          )}
          {currentStep === 'storage' && (
            <StorageStep
              key="storage"
              onNext={() => setCurrentStep('connect')}
              onBack={() => setCurrentStep('trust')}
            />
          )}
          {currentStep === 'connect' && (
            <ConnectStep
              key="connect"
              onNext={() => setCurrentStep('processing')}
              onBack={() => setCurrentStep('storage')}
            />
          )}
          {currentStep === 'processing' && (
            <ProcessingStep key="processing" onComplete={onComplete} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

const ProgressBar = ({ currentStep }: { currentStep: Step }) => {
  const steps: { id: Step; label: string }[] = [
    { id: 'trust', label: 'Trust & Security' },
    { id: 'storage', label: 'Your Storage' },
    { id: 'connect', label: 'Connect' },
    { id: 'processing', label: 'Health Check' },
  ];

  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="mb-16">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`
                w-10 h-10 rounded-full border-2 flex items-center justify-center mb-2 transition-all duration-300
                ${
                  currentIndex === index
                    ? 'border-green-500 bg-green-500/20 text-green-400'
                    : currentIndex > index
                      ? 'border-green-500 bg-green-500 text-white'
                      : 'border-white/20 text-gray-600'
                }
              `}
              >
                {currentIndex > index ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
              <span
                className={`text-sm ${currentIndex === index ? 'text-white' : 'text-gray-600'}`}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`
                h-0.5 flex-1 mx-4 transition-all duration-300
                ${currentIndex > index ? 'bg-green-500' : 'bg-white/10'}
              `}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const TrustStep = ({ onNext }: { onNext: () => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="text-center max-w-3xl mx-auto"
    >
      {/* Trust Badge */}
      <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 mb-8">
        <Shield className="w-5 h-5" />
        <span className="font-medium">Your Data, Your Control, Always</span>
      </div>

      {/* Headline */}
      <h1 className="text-5xl font-medium tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 mb-6">
        Think of This as a
        <br />
        Medical Check-Up
      </h1>

      {/* Description */}
      <p className="text-xl text-gray-400 mb-12 leading-relaxed">
        Just like your doctor analyzes your blood work but doesn&apos;t keep your blood, we analyze
        your financial health but{' '}
        <span className="text-green-400 font-medium">never store your data</span>.
        <br />
        <br />
        You bring your own storage. We just read it, analyze it, and give you the diagnosis.
      </p>

      {/* Trust Guarantees */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <TrustCard
          icon={<Eye className="w-6 h-6" />}
          title="We Can't See Your Data"
          description="Encrypted in transit and at rest. We only see metadata."
        />
        <TrustCard
          icon={<Lock className="w-6 h-6" />}
          title="Zero Data Retention"
          description="We process in memory. Nothing is stored on our servers."
        />
        <TrustCard
          icon={<Shield className="w-6 h-6" />}
          title="Your Storage Rules"
          description="Use your own S3, Azure, or Google Cloud. You control access."
        />
      </div>

      {/* CTA */}
      <button
        onClick={onNext}
        className="group inline-flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-b from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 transition-all duration-300 shadow-xl shadow-green-500/20"
      >
        <span className="font-medium">I Understand — Let&apos;s Continue</span>
        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </button>

      {/* Fine Print */}
      <p className="text-xs text-gray-600 mt-6">
        100% Free • No Credit Card • SOC 2 Type II Compliant
      </p>
    </motion.div>
  );
};

const TrustCard = ({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) => (
  <div className="p-6 rounded-xl border border-white/10 bg-[#0A0A0A]">
    <div className="inline-flex p-3 rounded-lg bg-green-500/10 text-green-400 mb-4">{icon}</div>
    <h3 className="font-medium mb-2">{title}</h3>
    <p className="text-sm text-gray-500">{description}</p>
  </div>
);

const StorageStep = ({ onNext, onBack }: { onNext: () => void; onBack: () => void }) => {
  const [selectedStorage, setSelectedStorage] = useState<string | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-4xl mx-auto"
    >
      <div className="text-center mb-12">
        <h2 className="text-4xl font-medium tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 mb-4">
          Where Is Your Data Stored?
        </h2>
        <p className="text-gray-400 text-lg">
          We&apos;ll connect directly to your storage. We never copy or move your data.
        </p>
      </div>

      {/* Storage Options */}
      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <StorageOption
          icon={<Cloud className="w-8 h-8" />}
          name="Amazon S3"
          description="Your AWS bucket"
          isSelected={selectedStorage === 's3'}
          onClick={() => setSelectedStorage('s3')}
        />
        <StorageOption
          icon={<Database className="w-8 h-8" />}
          name="Azure Blob"
          description="Your Azure storage"
          isSelected={selectedStorage === 'azure'}
          onClick={() => setSelectedStorage('azure')}
        />
        <StorageOption
          icon={<Server className="w-8 h-8" />}
          name="Google Cloud"
          description="Your GCS bucket"
          isSelected={selectedStorage === 'gcs'}
          onClick={() => setSelectedStorage('gcs')}
        />
      </div>

      {/* Security Note */}
      {selectedStorage && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="p-6 rounded-xl bg-green-500/5 border border-green-500/20 mb-8"
        >
          <div className="flex items-start gap-4">
            <Shield className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-medium text-green-400 mb-2">Read-Only Access Required</h4>
              <p className="text-sm text-gray-400">
                We&apos;ll ask for temporary, read-only credentials. We cannot write, modify, or
                delete your data. You can revoke access anytime from your{' '}
                {selectedStorage === 's3'
                  ? 'AWS'
                  : selectedStorage === 'azure'
                    ? 'Azure'
                    : 'Google Cloud'}{' '}
                console.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!selectedStorage}
          className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-b from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 group"
        >
          <span>Continue to Connection</span>
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </motion.div>
  );
};

const StorageOption = ({
  icon,
  name,
  description,
  isSelected,
  onClick,
}: {
  icon: React.ReactNode;
  name: string;
  description: string;
  isSelected: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`
      relative p-8 rounded-2xl border-2 text-center transition-all duration-300 group
      ${
        isSelected
          ? 'border-green-500 bg-green-500/10'
          : 'border-white/10 bg-[#0A0A0A] hover:border-white/20 hover:bg-white/5'
      }
    `}
  >
    <div
      className={`
      inline-flex p-4 rounded-xl mb-4 transition-colors
      ${isSelected ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-gray-400 group-hover:text-white'}
    `}
    >
      {icon}
    </div>
    <h3 className="text-xl font-medium mb-2">{name}</h3>
    <p className="text-gray-500">{description}</p>

    {isSelected && (
      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-4 right-4">
        <CheckCircle2 className="w-6 h-6 text-green-500" />
      </motion.div>
    )}
  </button>
);

const ConnectStep = ({ onNext, onBack }: { onNext: () => void; onBack: () => void }) => {
  const [credentials, setCredentials] = useState({ accessKey: '', secretKey: '', bucket: '' });
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = () => {
    setIsConnecting(true);
    setTimeout(() => {
      setIsConnecting(false);
      onNext();
    }, 2000);
  };

  const isValid = credentials.accessKey && credentials.secretKey && credentials.bucket;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-2xl mx-auto"
    >
      <div className="text-center mb-12">
        <h2 className="text-4xl font-medium tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 mb-4">
          Connect to Your Storage
        </h2>
        <p className="text-gray-400 text-lg">Provide temporary read-only credentials</p>
      </div>

      {/* Credentials Form */}
      <div className="p-8 rounded-2xl border border-white/10 bg-[#0A0A0A] mb-8 space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Access Key ID</label>
          <input
            type="text"
            placeholder="AKIA..."
            value={credentials.accessKey}
            onChange={(e) => setCredentials({ ...credentials, accessKey: e.target.value })}
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-green-500/50 focus:outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Secret Access Key</label>
          <input
            type="password"
            placeholder="••••••••••••••••"
            value={credentials.secretKey}
            onChange={(e) => setCredentials({ ...credentials, secretKey: e.target.value })}
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-green-500/50 focus:outline-none transition-colors"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Bucket Name</label>
          <input
            type="text"
            placeholder="my-financial-data"
            value={credentials.bucket}
            onChange={(e) => setCredentials({ ...credentials, bucket: e.target.value })}
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 focus:border-green-500/50 focus:outline-none transition-colors"
          />
        </div>

        {/* Security Note */}
        <div className="p-4 rounded-lg bg-violet-500/5 border border-violet-500/20 flex items-start gap-3">
          <Lock className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-gray-400">
            These credentials are used once and never stored. We only read data during this session.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="px-6 py-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300"
        >
          Back
        </button>
        <button
          onClick={handleConnect}
          disabled={!isValid || isConnecting}
          className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-b from-green-500 to-green-600 hover:from-green-400 hover:to-green-500 disabled:from-gray-700 disabled:to-gray-800 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2"
        >
          {isConnecting ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
              />
              <span>Connecting...</span>
            </>
          ) : (
            <>
              <span>Start Health Check</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
};

const ProcessingStep = ({ onComplete }: { onComplete: () => void }) => {
  const [progress, setProgress] = useState(0);

  useState(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(onComplete, 1000);
          return 100;
        }
        return prev + 5;
      });
    }, 150);

    return () => clearInterval(interval);
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-center max-w-2xl mx-auto"
    >
      <div className="mb-12">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 mb-6">
          <Shield className="w-4 h-4" />
          <span className="text-sm">Analyzing your financial health...</span>
        </div>
        <h2 className="text-4xl font-medium tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 mb-4">
          Running Your Check-Up
        </h2>
        <p className="text-gray-400 text-lg">
          We&apos;re analyzing your data for IFRS compliance and audit readiness
        </p>
      </div>

      {/* Progress */}
      <div className="p-8 rounded-2xl border border-white/10 bg-[#0A0A0A] mb-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500 font-mono">PROCESSING</span>
            <span className="text-sm text-green-400 font-mono">{progress}%</span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-green-500 to-violet-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Processing Steps */}
        <div className="space-y-3">
          <ProcessingItem label="Reading data structure" delay={0} />
          <ProcessingItem label="Mapping to IFRS standards" delay={1} />
          <ProcessingItem label="Tracing lineage" delay={2} />
          <ProcessingItem label="Validating audit trail" delay={3} />
          <ProcessingItem label="Generating reports" delay={4} />
        </div>
      </div>

      <p className="text-sm text-gray-500">
        Your data remains in your storage. We&apos;re only reading and analyzing.
      </p>
    </motion.div>
  );
};

const ProcessingItem = ({ label, delay }: { label: string; delay: number }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: delay * 0.5 }}
    className="flex items-center justify-between p-4 rounded-lg bg-white/5"
  >
    <span className="text-sm">{label}</span>
    <CheckCircle2 className="w-5 h-5 text-green-500" />
  </motion.div>
);
