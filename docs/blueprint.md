# **App Name**: Rackt: The Social Sports Hub

## Core Features:

- Authentication: User Authentication: Secure email/password authentication with Firebase, creating new user documents in Firestore on signup.
- Profile Management: Profile Management: Users can create and edit their profiles, displaying their stats, achievements, and sport preferences.
- Challenge System: Challenge System: Challenge friends directly or create open challenges for others to join, across different sports.
- Match Reporting: Match Reporting: Report match results for singles and doubles, automatically updating RacktRank using the ELO algorithm.
- Rank Tracking: RacktRank Tracking: Display a user's current RacktRank, stats, ELO progression chart, and match history on their dashboard.
- AI Match Predictor: AI Match Prediction Tool: Uses the 'predictMatch' flow to analyze two players' stats and predict a winner with confidence level and analysis. It reasons about the input stats before producing the prediction.
- Match Recap: Match Recap Generator: The 'getMatchRecap' flow generates a short narrative of a match, powered by AI.

## Style Guidelines:

- Primary color: Vivid blue (#3982F6) for a modern and sporty feel. This color conveys energy and trustworthiness.
- Background color: Light theme: Light gray (#F4F7F9), Dark theme: Dark gray (#2D3748).  These provide a neutral backdrop that emphasizes the content.
- Accent color: Bright orange (#E67700) for calls to action and highlights, adding a pop of energy and enthusiasm.
- Body and headline font: 'Inter', a sans-serif font for clear and modern readability.
- Use clean, minimalist icons from ShadCN UI's Lucide library.
- Collapsible sidebar for desktop and bottom navigation bar for mobile, ensuring intuitive navigation across devices.
- Subtle transitions and animations for a smooth, engaging user experience.