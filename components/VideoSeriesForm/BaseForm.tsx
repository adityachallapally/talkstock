import { Form } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { Step1Topic } from './Step1Topic'
import { Step2Details } from './Step2Details'
import { Step3Series } from './Step3Series'

export function BaseForm({ form, onSubmit, isSeries = false, submitText }) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Step1Topic form={form} />
        
        <div className="h-px bg-gray-200 my-6" />
        
        <Step2Details form={form} />
        
        <div className="h-px bg-gray-200 my-6" />
        
        <Step3Series form={form} isSeries={isSeries} />
        
        <Button type="submit" className="w-full">
          {submitText}
        </Button>
      </form>
    </Form>
  )
}