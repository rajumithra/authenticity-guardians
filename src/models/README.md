
# Bot Detection Models

This folder would contain trained machine learning models for bot detection.

In a production implementation, you would find:

- `model.pkl`: A trained model file that can classify traffic as bot or human
- Feature importance analysis
- Model performance metrics
- Threshold settings for bot scores

The model would analyze various features including:
- Mouse movement patterns
- Keyboard dynamics
- Navigation patterns
- Time intervals between actions
- Request patterns

For this demonstration, the logic is implemented directly in the botDetection.ts utility file, but in a real-world application, this would be a more sophisticated machine learning model.
