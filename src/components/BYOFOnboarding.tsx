import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
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
} from 'lucide-react'

interface BYOFOnboardingProps {
  onComplete: () => void
  onBack: () => void
}

type Step = 'trust' | 'storage' | 'connect' | 'processing'

export const BYOFOnboarding = ({ onComplete, onBack }: BYOFOnboardingProps) => {
  const [currentStep, setCurrentStep] = useState<Step>('trust')

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-20">
      <div className="w-full max-w-5xl">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="mb-8 flex items-center gap-2 text-gray-400 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
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
  )
}

const ProgressBar = ({ currentStep }: { currentStep: Step }) => {
  const steps: { id: Step; label: string }[] = [
    { id: 'trust', label: 'Trust & Security' },
    { id: 'storage', label: 'Your Storage' },
    { id: 'connect', label: 'Connect' },
    { id: 'processing', label: 'Health Check' },
  ]

  const currentIndex = steps.findIndex((s) => s.id === currentStep)

  return (
    <div className="mb-16">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex flex-1 items-center">
            <div className="flex flex-1 flex-col items-center">
              <div
                className={`mb-2 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                  currentIndex === index
                    ? 'border-green-500 bg-green-500/20 text-green-400'
                    : currentIndex > index
                      ? 'border-green-500 bg-green-500 text-white'
                      : 'border-white/20 text-gray-600'
                } `}
              >
                {currentIndex > index ? (
                  <CheckCircle2 className="h-5 w-5" />
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
                className={`mx-4 h-0.5 flex-1 transition-all duration-300 ${currentIndex > index ? 'bg-green-500' : 'bg-white/10'} `}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

const TrustStep = ({ onNext }: { onNext: () => void }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="mx-auto max-w-3xl text-center"
    >
      {/* Trust Badge */}
      <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-green-500/20 bg-green-500/10 px-6 py-3 text-green-400">
        <Shield className="h-5 w-5" />
        <span className="font-medium">Your Data, Your Control, Always</span>
      </div>

      {/* Headline */}
      <h1 className="mb-6 bg-gradient-to-b from-white to-white/60 bg-clip-text text-5xl font-medium tracking-tighter text-transparent">
        Think of This as a
        <br />
        Medical Check-Up
      </h1>

      {/* Description */}
      <p className="mb-12 text-xl leading-relaxed text-gray-400">
        Just like your doctor analyzes your blood work but doesn&apos;t keep
        your blood, we analyze your financial health but{' '}
        <span className="font-medium text-green-400">
          never store your data
        </span>
        .
        <br />
        <br />
        You bring your own storage. We just read it, analyze it, and give you
        the diagnosis.
      </p>

      {/* Trust Guarantees */}
      <div className="mb-12 grid gap-6 md:grid-cols-3">
        <TrustCard
          icon={<Eye className="h-6 w-6" />}
          title="We Can't See Your Data"
          description="Encrypted in transit and at rest. We only see metadata."
        />
        <TrustCard
          icon={<Lock className="h-6 w-6" />}
          title="Zero Data Retention"
          description="We process in memory. Nothing is stored on our servers."
        />
        <TrustCard
          icon={<Shield className="h-6 w-6" />}
          title="Your Storage Rules"
          description="Use your own S3, Azure, or Google Cloud. You control access."
        />
      </div>

      {/* CTA */}
      <button
        onClick={onNext}
        className="group inline-flex items-center gap-3 rounded-xl bg-gradient-to-b from-green-500 to-green-600 px-8 py-4 shadow-xl shadow-green-500/20 transition-all duration-300 hover:from-green-400 hover:to-green-500"
      >
        <span className="font-medium">I Understand — Let&apos;s Continue</span>
        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
      </button>

      {/* Fine Print */}
      <p className="mt-6 text-xs text-gray-600">
        100% Free • No Credit Card • SOC 2 Type II Compliant
      </p>
    </motion.div>
  )
}

const TrustCard = ({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) => (
  <div className="rounded-xl border border-white/10 bg-[#0A0A0A] p-6">
    <div className="mb-4 inline-flex rounded-lg bg-green-500/10 p-3 text-green-400">
      {icon}
    </div>
    <h3 className="mb-2 font-medium">{title}</h3>
    <p className="text-sm text-gray-500">{description}</p>
  </div>
)

const StorageStep = ({
  onNext,
  onBack,
}: {
  onNext: () => void
  onBack: () => void
}) => {
  const [selectedStorage, setSelectedStorage] = useState<string | null>(null)

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="mx-auto max-w-4xl"
    >
      <div className="mb-12 text-center">
        <h2 className="mb-4 bg-gradient-to-b from-white to-white/60 bg-clip-text text-4xl font-medium tracking-tighter text-transparent">
          Where Is Your Data Stored?
        </h2>
        <p className="text-lg text-gray-400">
          We&apos;ll connect directly to your storage. We never copy or move
          your data.
        </p>
      </div>

      {/* Storage Options */}
      <div className="mb-12 grid gap-6 md:grid-cols-3">
        <StorageOption
          icon={<Cloud className="h-8 w-8" />}
          name="Amazon S3"
          description="Your AWS bucket"
          isSelected={selectedStorage === 's3'}
          onClick={() => setSelectedStorage('s3')}
        />
        <StorageOption
          icon={<Database className="h-8 w-8" />}
          name="Azure Blob"
          description="Your Azure storage"
          isSelected={selectedStorage === 'azure'}
          onClick={() => setSelectedStorage('azure')}
        />
        <StorageOption
          icon={<Server className="h-8 w-8" />}
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
          className="mb-8 rounded-xl border border-green-500/20 bg-green-500/5 p-6"
        >
          <div className="flex items-start gap-4">
            <Shield className="mt-1 h-6 w-6 flex-shrink-0 text-green-400" />
            <div>
              <h4 className="mb-2 font-medium text-green-400">
                Read-Only Access Required
              </h4>
              <p className="text-sm text-gray-400">
                We&apos;ll ask for temporary, read-only credentials. We cannot
                write, modify, or delete your data. You can revoke access
                anytime from your{' '}
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
          className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 transition-all duration-300 hover:bg-white/10"
        >
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!selectedStorage}
          className="group flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-green-500 to-green-600 px-6 py-3 transition-all duration-300 hover:from-green-400 hover:to-green-500 disabled:cursor-not-allowed disabled:from-gray-700 disabled:to-gray-800"
        >
          <span>Continue to Connection</span>
          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </motion.div>
  )
}

const StorageOption = ({
  icon,
  name,
  description,
  isSelected,
  onClick,
}: {
  icon: React.ReactNode
  name: string
  description: string
  isSelected: boolean
  onClick: () => void
}) => (
  <button
    onClick={onClick}
    className={`group relative rounded-2xl border-2 p-8 text-center transition-all duration-300 ${
      isSelected
        ? 'border-green-500 bg-green-500/10'
        : 'border-white/10 bg-[#0A0A0A] hover:border-white/20 hover:bg-white/5'
    } `}
  >
    <div
      className={`mb-4 inline-flex rounded-xl p-4 transition-colors ${isSelected ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-gray-400 group-hover:text-white'} `}
    >
      {icon}
    </div>
    <h3 className="mb-2 text-xl font-medium">{name}</h3>
    <p className="text-gray-500">{description}</p>

    {isSelected && (
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className="absolute right-4 top-4"
      >
        <CheckCircle2 className="h-6 w-6 text-green-500" />
      </motion.div>
    )}
  </button>
)

const ConnectStep = ({
  onNext,
  onBack,
}: {
  onNext: () => void
  onBack: () => void
}) => {
  const [credentials, setCredentials] = useState({
    accessKey: '',
    secretKey: '',
    bucket: '',
  })
  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnect = () => {
    setIsConnecting(true)
    setTimeout(() => {
      setIsConnecting(false)
      onNext()
    }, 2000)
  }

  const isValid =
    credentials.accessKey && credentials.secretKey && credentials.bucket

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="mx-auto max-w-2xl"
    >
      <div className="mb-12 text-center">
        <h2 className="mb-4 bg-gradient-to-b from-white to-white/60 bg-clip-text text-4xl font-medium tracking-tighter text-transparent">
          Connect to Your Storage
        </h2>
        <p className="text-lg text-gray-400">
          Provide temporary read-only credentials
        </p>
      </div>

      {/* Credentials Form */}
      <div className="mb-8 space-y-6 rounded-2xl border border-white/10 bg-[#0A0A0A] p-8">
        <div>
          <label className="mb-2 block text-sm font-medium">
            Access Key ID
          </label>
          <input
            type="text"
            placeholder="AKIA..."
            value={credentials.accessKey}
            onChange={(e) =>
              setCredentials({ ...credentials, accessKey: e.target.value })
            }
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 transition-colors focus:border-green-500/50 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">
            Secret Access Key
          </label>
          <input
            type="password"
            placeholder="••••••••••••••••"
            value={credentials.secretKey}
            onChange={(e) =>
              setCredentials({ ...credentials, secretKey: e.target.value })
            }
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 transition-colors focus:border-green-500/50 focus:outline-none"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">Bucket Name</label>
          <input
            type="text"
            placeholder="my-financial-data"
            value={credentials.bucket}
            onChange={(e) =>
              setCredentials({ ...credentials, bucket: e.target.value })
            }
            className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 transition-colors focus:border-green-500/50 focus:outline-none"
          />
        </div>

        {/* Security Note */}
        <div className="flex items-start gap-3 rounded-lg border border-violet-500/20 bg-violet-500/5 p-4">
          <Lock className="mt-0.5 h-5 w-5 flex-shrink-0 text-violet-400" />
          <p className="text-sm text-gray-400">
            These credentials are used once and never stored. We only read data
            during this session.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 transition-all duration-300 hover:bg-white/10"
        >
          Back
        </button>
        <button
          onClick={handleConnect}
          disabled={!isValid || isConnecting}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-green-500 to-green-600 px-6 py-3 transition-all duration-300 hover:from-green-400 hover:to-green-500 disabled:cursor-not-allowed disabled:from-gray-700 disabled:to-gray-800"
        >
          {isConnecting ? (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="h-5 w-5 rounded-full border-2 border-white/30 border-t-white"
              />
              <span>Connecting...</span>
            </>
          ) : (
            <>
              <span>Start Health Check</span>
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </button>
      </div>
    </motion.div>
  )
}

const ProcessingStep = ({ onComplete }: { onComplete: () => void }) => {
  const [progress, setProgress] = useState(0)

  useState(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setTimeout(onComplete, 1000)
          return 100
        }
        return prev + 5
      })
    }, 150)

    return () => clearInterval(interval)
  })

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="mx-auto max-w-2xl text-center"
    >
      <div className="mb-12">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/10 px-4 py-2 text-green-400">
          <Shield className="h-4 w-4" />
          <span className="text-sm">Analyzing your financial health...</span>
        </div>
        <h2 className="mb-4 bg-gradient-to-b from-white to-white/60 bg-clip-text text-4xl font-medium tracking-tighter text-transparent">
          Running Your Check-Up
        </h2>
        <p className="text-lg text-gray-400">
          We&apos;re analyzing your data for IFRS compliance and audit readiness
        </p>
      </div>

      {/* Progress */}
      <div className="mb-8 rounded-2xl border border-white/10 bg-[#0A0A0A] p-8">
        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-sm text-gray-500">PROCESSING</span>
            <span className="font-mono text-sm text-green-400">
              {progress}%
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/5">
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
        Your data remains in your storage. We&apos;re only reading and
        analyzing.
      </p>
    </motion.div>
  )
}

const ProcessingItem = ({ label, delay }: { label: string; delay: number }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: delay * 0.5 }}
    className="flex items-center justify-between rounded-lg bg-white/5 p-4"
  >
    <span className="text-sm">{label}</span>
    <CheckCircle2 className="h-5 w-5 text-green-500" />
  </motion.div>
)
