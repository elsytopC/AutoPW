type Annotation = { type: string; description: string };

// allure-playwright turns only `@allure.label.<name>` annotations into labels;
// any other annotation type is rendered as a fake passed step.
export function behavior(epic: string, feature: string): Annotation[] {
  return [
    { type: '@allure.label.epic', description: epic },
    { type: '@allure.label.feature', description: feature },
  ];
}
