import { FormField, FormItem, FormLabel, FormControl } from "@/components/ui/form"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

export function Step2Details({ form }) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Step 2</h2>
      <FormField
        control={form.control}
        name="voice"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel>Narration Voice</FormLabel>
            <FormControl>
              <RadioGroup
                onValueChange={field.onChange}
                value={field.value}
                className="flex space-x-4"
              >
                {["Echo", "Alloy", "Onyx", "Fable"].map((voice) => (
                  <FormItem key={voice} className="flex items-center space-x-2">
                    <FormControl>
                      <RadioGroupItem value={voice} />
                    </FormControl>
                    <FormLabel className="font-normal">{voice}</FormLabel>
                  </FormItem>
                ))}
              </RadioGroup>
            </FormControl>
          </FormItem>
        )}
      />

      <div className="flex space-x-6">
        <FormField
          control={form.control}
          name="language"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel>Video Language</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English US</SelectItem>
                  {/* Add other language options here */}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="duration"
          render={({ field }) => (
            <FormItem className="flex-1 space-y-3">
              <FormLabel>Duration Preference</FormLabel>
              <div className="flex space-x-4">
                {["30-60", "60-90"].map((duration) => (
                  <Button
                    key={duration}
                    type="button"
                    variant={field.value === duration ? "default" : "outline"}
                    onClick={() => field.onChange(duration)}
                  >
                    {duration === "30-60" ? "~30 seconds" : "~60 seconds"}
                  </Button>
                ))}
              </div>
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}
