'use client'
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from 'next/navigation'
import { SeriesSchema, SeriesSchemaType } from '@/lib/schemas'
import { BaseForm } from '@/components/VideoSeriesForm/BaseForm'

export default function CreateSeriesPage() {
  const router = useRouter()

  const form = useForm<SeriesSchemaType>({
    resolver: zodResolver(SeriesSchema),
    defaultValues: SeriesSchema.parse({}),
  })

  const onSubmit = async (data: SeriesSchemaType) => {
    const formData = new FormData()
    // Object.entries(data).forEach(([key, value]) => {
    //   formData.append(key, value)
    // })

    console.log(data) // For debugging
    // Uncomment the following when ready to implement series creation
    // const result = await createSeries(formData)
    // if (result && result.id) {
    //   router.push(`/dashboard/view_series/${result.id}`)
    // }
  }

  return (
    <BaseForm 
      form={form} 
      onSubmit={onSubmit} 
      isSeries={true} 
      submitText="CREATE SERIES"
    />
  )
}