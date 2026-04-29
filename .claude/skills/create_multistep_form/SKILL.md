---
name: create_multistep_form
description: Create standardized multi-step forms with validation, animation, and state management.
---

# Create Multi-step Form (React Hook Form)

This skill guides you through creating a multi-step form (wizard) in `apps/<app>/src/components/`.

**Location:** `apps/<app>/src/components/<feature>/<form-name>/`

## 1. Folder Structure

```
<form-name>/
├── index.tsx                # Container (Layout, Progress, Animation)
├── steps.ts                 # Step Definitions (ID, Component, Fields)
├── schema.ts                # Zod Schema (Combined & Split)
├── types.ts                 # TS Types
├── use<FormName>.ts         # Logic Hook
└── steps/                   # Step Components
    ├── step-one.tsx
    └── step-two.tsx
```

## 2. Schema & Steps (`schema.ts` & `steps.ts`)

Define the full schema and per-step field keys for validation.

```typescript
// schema.ts
import { z } from 'zod';

export const formSchema = z.object({
  firstName: z.string().min(1),
  email: z.string().email(),
  // ...
});

export type FormSchema = z.infer<typeof formSchema>;

export const STEP_1_FIELDS: (keyof FormSchema)[] = ['firstName'];
export const STEP_2_FIELDS: (keyof FormSchema)[] = ['email'];
```

```typescript
// steps.ts
import StepOne from './steps/step-one';
import StepTwo from './steps/step-two';

export enum StepId {
  Step1 = 'step-1',
  Step2 = 'step-2',
}

export const STEPS = [
  { id: StepId.Step1, component: StepOne, fields: STEP_1_FIELDS },
  { id: StepId.Step2, component: StepTwo, fields: STEP_2_FIELDS },
];
```

## 3. Logic Hook (`use<FormName>.ts`)

Manage state and validation.

```typescript
import { useState, useCallback } from 'react';
import { useForm, zodResolver } from '@birthup/ui/lib/form';
import { formSchema, type FormSchema } from './schema';
import { STEPS } from './steps';

export function useMyForm() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const form = useForm<FormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      /* ... */
    },
  });

  const handleNext = useCallback(async () => {
    const fields = STEPS[currentStepIndex].fields;
    const isValid = await form.trigger(fields); // Validate current step
    if (!isValid) return;

    if (currentStepIndex < STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleSubmit();
    }
  }, [currentStepIndex, form]);

  const handleBack = useCallback(() => {
    if (currentStepIndex > 0) setCurrentStepIndex((prev) => prev - 1);
  }, [currentStepIndex]);

  const handleSubmit = form.handleSubmit(async (data) => {
    // Call API Mutation
  });

  return {
    currentStepIndex,
    CurrentComponent: STEPS[currentStepIndex].component,
    form,
    handleNext,
    handleBack,
    isFirstStep: currentStepIndex === 0,
    isLastStep: currentStepIndex === STEPS.length - 1,
  };
}
```

## 4. Container Component (`index.tsx`)

Handles layout and animation.

```typescript
import { AnimatePresence, motion } from 'framer-motion';
import { Form } from '@birthup/ui/components/base/form';
import { useMyForm } from './useMyForm';

export default function MyForm() {
  const { CurrentComponent, form, currentStepIndex, handleNext, handleBack } = useMyForm();

  return (
    <div className="max-w-2xl mx-auto">
      <Progress steps={STEPS} current={currentStepIndex} />

      <Form {...form}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStepIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <CurrentComponent onNext={handleNext} onBack={handleBack} />
          </motion.div>
        </AnimatePresence>
      </Form>
    </div>
  );
}
```
