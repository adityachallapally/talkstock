import { FormField, FormItem, FormLabel } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function Step1Topic({ form }) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">Step 1</h2>
      <FormField
        control={form.control}
        name="topic"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Topic</FormLabel>
            <Input
              placeholder="Enter your topic"
              {...field}
            />
            <div className="mt-2">
              <p className="text-sm text-gray-500 mb-2">Currently Trending:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  "Interesting History",
                  "Facts About India",
                  "Space Exploration",
                  "Wildlife Conservation",
                  "Ancient Civilizations"
                ].map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="outline"
                    size="sm"
                    onClick={() => field.onChange(suggestion)}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {[
                  "Cooking Tips",
                  "Technology Trends",
                  "Climate Change",
                  "Art History",
                  "Financial Literacy"
                ].map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="outline"
                    size="sm"
                    onClick={() => field.onChange(suggestion)}
                  >
                    {suggestion}
                  </Button>
                ))}
              </div>
            </div>
          </FormItem>
        )}
      />
    </div>
  )
}