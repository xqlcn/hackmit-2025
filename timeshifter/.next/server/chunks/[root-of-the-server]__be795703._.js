module.exports = [
"[project]/.next-internal/server/app/api/schedule/route/actions.js [app-rsc] (server actions loader, ecmascript)", ((__turbopack_context__, module, exports) => {

}),
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[project]/app/api/schedule/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
;
async function POST(request) {
    try {
        const body = await request.json();
        const { wake, sleep, chronotype, commitments } = body;
        // Parse wake and sleep times
        const wakeTime = new Date(`2000-01-01T${wake}:00`);
        const sleepTime = new Date(`2000-01-01T${sleep}:00`);
        // If sleep time is before wake time, assume it's the next day
        if (sleepTime <= wakeTime) {
            sleepTime.setDate(sleepTime.getDate() + 1);
        }
        // Generate schedule based on chronotype
        const schedule = [];
        // Add commitments first
        commitments.forEach((commitment)=>{
            schedule.push({
                start: commitment.start,
                end: commitment.end,
                label: 'commitment',
                rationale: `Scheduled commitment: ${commitment.title}`,
                confidence: 1.0
            });
        });
        // Add chronotype-specific schedule blocks
        if (chronotype === 'morning') {
            schedule.push({
                start: wake,
                end: formatTime(addMinutes(wakeTime, 30)),
                label: 'sleep',
                rationale: 'Morning chronotype - gentle wake-up routine',
                confidence: 0.9
            }, {
                start: formatTime(addMinutes(wakeTime, 45)),
                end: formatTime(addMinutes(wakeTime, 90)),
                label: 'exercise',
                rationale: 'Peak energy window for morning chronotypes',
                confidence: 0.8
            }, {
                start: formatTime(addMinutes(wakeTime, 120)),
                end: formatTime(addMinutes(wakeTime, 240)),
                label: 'focus',
                rationale: 'High cognitive performance period',
                confidence: 0.9
            });
        } else if (chronotype === 'evening') {
            schedule.push({
                start: wake,
                end: formatTime(addMinutes(wakeTime, 60)),
                label: 'light',
                rationale: 'Evening chronotype - gradual morning activation',
                confidence: 0.8
            }, {
                start: formatTime(addMinutes(wakeTime, 180)),
                end: formatTime(addMinutes(wakeTime, 240)),
                label: 'exercise',
                rationale: 'Late morning exercise for evening chronotypes',
                confidence: 0.7
            }, {
                start: formatTime(addMinutes(wakeTime, 360)),
                end: formatTime(addMinutes(wakeTime, 480)),
                label: 'focus',
                rationale: 'Peak cognitive performance in afternoon',
                confidence: 0.9
            });
        } else {
            schedule.push({
                start: wake,
                end: formatTime(addMinutes(wakeTime, 45)),
                label: 'sleep',
                rationale: 'Intermediate chronotype - balanced wake routine',
                confidence: 0.8
            }, {
                start: formatTime(addMinutes(wakeTime, 90)),
                end: formatTime(addMinutes(wakeTime, 150)),
                label: 'exercise',
                rationale: 'Optimal morning exercise window',
                confidence: 0.8
            }, {
                start: formatTime(addMinutes(wakeTime, 180)),
                end: formatTime(addMinutes(wakeTime, 300)),
                label: 'focus',
                rationale: 'Peak cognitive performance period',
                confidence: 0.9
            });
        }
        // Add break periods
        schedule.push({
            start: '12:00',
            end: '13:00',
            label: 'break',
            rationale: 'Lunch break - essential for circadian rhythm',
            confidence: 0.9
        }, {
            start: '15:30',
            end: '15:45',
            label: 'break',
            rationale: 'Afternoon energy dip - short recovery break',
            confidence: 0.8
        });
        // Sort schedule by start time
        schedule.sort((a, b)=>a.start.localeCompare(b.start));
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            schedule
        });
    } catch (error) {
        console.error('Error generating schedule:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Failed to generate schedule'
        }, {
            status: 500
        });
    }
}
function formatTime(date) {
    return date.toTimeString().slice(0, 5);
}
function addMinutes(date, minutes) {
    const result = new Date(date);
    result.setMinutes(result.getMinutes() + minutes);
    return result;
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__be795703._.js.map