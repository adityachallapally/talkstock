import { FormField, FormItem, FormLabel, FormDescription } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function Step3Series({ form, isSeries = true }) {
  if (!isSeries) return null;
  
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Step 3</h2>
      <div className="space-y-6">
        <div className="flex space-x-6">
          <FormField
            control={form.control}
            name="frequency"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Frequency</FormLabel>
                <FormDescription>How often should videos be posted?</FormDescription>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="biweekly">Bi-weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="destination"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Destination</FormLabel>
                <FormDescription>Where to post your video series</FormDescription>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <SelectTrigger>
                    <SelectValue placeholder="Email Me Instead" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email Me Instead</SelectItem>
                  </SelectContent>
                </Select>
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  )
}