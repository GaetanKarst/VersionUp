export default function SuggestPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Get a Workout Suggestion</h1>
      <p className="mb-6 text-gray-600 dark:text-gray-300">
        What are your goals?
      </p>
      <form className="space-y-6 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <div>
          <label htmlFor="goal" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">
            Primary Goal
          </label>
          <div className="mt-2">
            <select
              id="goal"
              name="goal"
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:bg-gray-700 dark:text-gray-200 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
            >
              <option>Build Endurance</option>
              <option>Increase Strength</option>
              <option>Lose Weight</option>
              <option>Active Recovery</option>
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="equipment" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">
            Available Equipment
          </label>
          <div className="mt-2">
            <input
              type="text"
              name="equipment"
              id="equipment"
              placeholder="e.g., Dumbbells, resistance bands, treadmill"
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:bg-gray-700 dark:text-gray-200 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
            />
          </div>
        </div>

        <div>
          <label htmlFor="time" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">
            Time Available (minutes)
          </label>
          <div className="mt-2">
            <input
              type="number"
              name="time"
              id="time"
              defaultValue="45"
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:bg-gray-700 dark:text-gray-200 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            onClick={(e) => e.preventDefault()}
            className="rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Suggest Workout
          </button>
        </div>
      </form>
    </div>
  );
}