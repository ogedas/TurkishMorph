/*
If your stims have specific blocks, set to true

If set to true, stims.csv must contain column called "block"
*/ 
const blocks = true; 
const numBlocks = 3;

// initialize jsPsych
var jsPsych = initJsPsych({
    show_progress_bar: true, 
    auto_update_progress_bar: true, //update automatically with each trial
    on_finish: function () {
        jsPsych.data.displayData(); // optional
    }
});

// Load stimuli
Papa.parse("stimuli/stims.csv", {
    download: true,
    header: true,
    complete: function (results) {
        stimuli = results.data;
        // stimuli = jsPsych.randomization.shuffle(stimuli);
        console.log(stimuli);

        startExperiment();
    }
});

// Generate random name for participant and datafile
const subject_id = jsPsych.randomization.randomID(10);
const filename = `${subject_id}.csv`;

// Main function that creates slides and runs experiment
function startExperiment() {

    // main timeline
    var timeline = [];

    // welcome and consent
    var Welcome_page = {
        type: jsPsychHtmlButtonResponse,
        stimulus: `
            <p><strong>Deney başlıyor. Lütfen dikkatlice okuyun:</strong></p>
            <p>Önümüzdeki yaklaşık 25–30 dakika boyunca ekranda bazı sözcükler göreceksiniz.</p>
            <p>Gördüğünüz her sözcüğün Türkçede var olan gerçek bir sözcük olup olmadığını belirleyin.</p>
            <p><strong>Gerçek kelime: “J”</strong> | <strong>Uydurma kelime: “F”</strong></p>
            <p>Hazırsanız devam etmek için “J” veya “F” tuşuna basın.</p>
            `,
        choices: ["Continue"]
    };

    var Consent_page = {
        type: jsPsychHtmlButtonResponse,
        stimulus: "Consent form here. By clicking continue, you consent to participate.",
        choices: ["Continue"]
    };

    var Practice_Intro_page = {
        type: jsPsychHtmlKeyboardResponse,
        stimulus: `
        <p><strong>Şimdi deneme yapısına alışmanız için birkaç alıştırma denemesiyle başlayacağız.</strong></p>
        <p>Her kelimeden önce kısa bir “+” işareti göreceksiniz.</p>
        <p><strong>Gerçek kelime: “J”</strong> | <strong>Uydurma kelime: “F”</strong></p>
        <p>Devam etmek için bir tuşa basın.</p>
    `,
    };

    // Define slides that will be repeated over and over (fixation cross and blank screen)
    var fixation = {
        type: jsPsychHtmlKeyboardResponse,
        stimulus: '<div style="font-size:40px;">+</div>',
        choices: "NO_KEYS",
        trial_duration: 300 //ms that fixation cross is on screen
    };

    var blank = {
        type: jsPsychHtmlKeyboardResponse,
        stimulus: ' ',
        choices: "NO_KEYS",
        trial_duration: 300 //ms in between fixation cross and stimulus
    };


    // Create Practice Trials with correct responses
    const practice_stims = [
        { stimulus: "A", correct_response: "j" },
        { stimulus: "B", correct_response: "f" },
        { stimulus: "C", correct_response: "j" },
        { stimulus: "D", correct_response: "f" },
    ];

    // Create array to hold practice trials
    const practice = [];

    // loop through all practice stimuli to create practice trials
    for (let i = 0; i < practice_stims.length; i++) {
        /* 
        For each practice trial, create a [fixation cross, blank page, conditional_loop]
        conditional_loop consists of a normal trial and a feedback page, if the answer is not correct
        the conditional_loop will loop back to through trail - feedback pages until the participant gets
        the answer correct.
        */
        const stimulus = practice_stims[i].stimulus;
        const correct_key = practice_stims[i].correct_response;

        const trial = {
            type: jsPsychHtmlKeyboardResponse,
            stimulus: `<div style="font-size:40px;">${stimulus}</div>`,
            choices: "ALL_KEYS",
            data: {
            type_of_trial: "practice",
            stimulus: stimulus,
            correct_response: correct_key
            },
            on_finish: function(data) {
            data.correct = data.response === data.correct_response;
            }
        };

        const feedback = {
            type: jsPsychHtmlKeyboardResponse,
            stimulus: function() {
                const last_trial_val = jsPsych.data.get().last(1).values()[0].response;
                const last_trial_correct = jsPsych.data.get().last(1).values()[0].correct;
                if (last_trial_correct) {
                    return "<div style='color: #20ad03;'>Correct!</div>";
                } else if (!["f", "j"].includes(last_trial_val)) {
                    return "<div style='color: #bf2900;'> Please only click f or j. Try again! </div>";
                } else {
                    return "<div style='color: red;'> Incorrect. Try again.</div>";
                }
            },
            choices: "NO_KEYS",
            trial_duration: 1500
        };

        const conditional_loop = {
            timeline: [trial, feedback],
            loop_function: function(data) {
                const last_response = data.values()[0];
                return !last_response.correct; // repeat if incorrect
            }
        };

        practice.push({
            timeline: [fixation, blank, conditional_loop]
        });
    };

    var mainIntro_page = {
        type: jsPsychHtmlKeyboardResponse,
        stimulus: `
        <p><strong>Şimdi deneme yapısına alışmanız için birkaç alıştırma denemesiyle başlayacağız.</strong></p>
        <p>Her kelimeden önce kısa bir “+” işareti göreceksiniz.</p>
        <p><strong>Gerçek kelime: “J”</strong> | <strong>Uydurma kelime: “F”</strong></p>
        <p>Devam etmek için bir tuşa basın.</p>
    `,
    };


    // Function to create the stimulus trials
    function createTrial(stim) {
        return {
            type: jsPsychHtmlKeyboardResponse,
            stimulus: `<div style="font-size:40px;">${stim.stimulus}</div>`,
            choices: ["j", "f"],
            data: {
                word: stim.stimulus,
                type_of_trial: "target",
                correct_response: stim.correct_response,
            },
            on_finish: function(data) {
                console.log("correct response: " + stim.correct_response);
                console.log("Response: " + data.response);
                // update number of correct trials in this block
                if (stim.correct_response == data.response) {
                    n_correct += 1;
                }
            }
        };
    };
    
    // Array to hold all blocks
    main_trials = [];

    /*
    Break slide

    In order to update the number of correct responses for each block dynamically, this is coded
    as a function, which returns a slide. The function is executed whenever the timeline reaches the break slide

    input: n_counter, number of trials in this block
    */
    function createBreakSlide(n_counter) {
        return {
            type: jsPsychHtmlKeyboardResponse,
            stimulus: function() {
                return "<p> You got " + Math.round((n_correct/n_counter)*100) + "% correct thus far. Take a short break! When you are ready to continue, press space. </p>";
            },
            choices: [" "], // User presses space to continue after the break
            on_finish: function (data) {
                // reset counters for next block
                n_correct = 0;  
            },
        };
    }


    // If you have blocks in your experiment, generate main trials for each block
    if (blocks) {

        n_counter = 0;
        n_correct = 0;
        
        let block_trials = [];

        // Loop through stimuli
        for (let i = 0; i < stimuli.length; i++) {

            let stim = stimuli[i];
            let word_trial = createTrial(stim);

            // update counter
            n_counter += 1;

            // Add the trials in blocks
            block_trials.push({
                timeline: [fixation, blank, word_trial]
            });

            // if we are in the last stimulus, don't have a break page:

            if (i === stimuli.length - 1) {
                // randomize order within the block
                block_trials = jsPsych.randomization.shuffle(block_trials);

                // Add this block to the main trials
                main_trials.push(block_trials);
            } else if (i + 1 === stimuli.length || Number(stimuli[i + 1].block) !== Number(stim.block)) {
            
                // Otherwise, if it is not the last stim in the experiment, but is the last stim in the block
                
                // randomize order within the block
                block_trials = jsPsych.randomization.shuffle(block_trials);

                // If it's the last trial in the current block, add the break page
                block_trials.push(createBreakSlide(n_counter));

                // Add this block to the main trials
                main_trials.push(block_trials);

                // empty block trials array to populate for the next block
                block_trials = [];

                // update counter for number of trials in a block
                n_counter = 0;
            };
        };
    } else {
      // If you don't have blocks, make trials based on number of breaks you want

        // Need to add this code
    };

    // Demographics
    var demographics = {
        type: jsPsychSurveyHtmlForm,
        preamble: '<h3>Final Questions</h3><p>Please answer all questions below before continuing.</p>',
        html: `
            <label for="name">Name:</label><br>
            <input type="text" id="name" name="name" required><br><br>

            <label for="gender">Gender:</label><br>
            <select id="gender" name="gender" required>
                <option value="" disabled selected>Select your gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
            </select><br><br>
        `,
        button_label: "Continue",
        on_finish: function(data) {
            const responses = data.response;
            jsPsych.data.addProperties({
                participant_name: responses.name,
                participant_gender: responses.gender
            });
                                            

        },
        data: {
            type_of_trial: "survey",
        }
    };

    /* 
    Trial that saves data to osf(datapipe). It will show (in English) "Please wait while data is being saved"

    Comment it out in the timeline below while testing

    Update experiment_id with the experiment id generated for you in datapipe (see readme)
    */
    const save_data = {
        type: jsPsychPipe,
        action: "save",
        experiment_id: "BOV3Bv0IMSzB", // This is the code generated by datapipe
        filename: filename,
        data_string: ()=>jsPsych.data.get().csv()
    }; 

    /* 
    End screen

    When testing, uncomment the last line to download the csv file locally
    */
    var end = {
        type: jsPsychHtmlButtonResponse,
        stimulus: "<h2>END</h2><p>Thank you for participating!</p>",
        choices: [],
        on_load: function() {
            console.log(jsPsych.data);
            // jsPsych.data.get().localSave('csv', 'experiment_data.csv');
        }
    };  


    /*
    Push all slides to the timeline
    */
    timeline.push(Welcome_page, 
                Consent_page, 
                Practice_Intro_page, 
                practice, 
                mainIntro_page,
                main_trials,
                demographics,
                save_data, // comment this out while testing to not save the data
                end);

    // run
    jsPsych.run(timeline);
}
