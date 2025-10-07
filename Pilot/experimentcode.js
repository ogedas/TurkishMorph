/*
If your stims have specific blocks, set to true

If set to true, stims.csv must contain column called "block"
*/ 
const blocks = true; 
const numBlocks = 4;

// initialize jsPsych
var jsPsych = initJsPsych({
    show_progress_bar: true, 
    auto_update_progress_bar: true, //update automatically with each trial
    on_finish: function () {
        jsPsych.data.displayData(); // optional
    }
});

// define stimuli variable globally
let stimuli; 

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
            <p>Önümüzdeki yaklaşık 30 dakika boyunca ekranda bazı sözcükler göreceksiniz.</p>
            <p>Gördüğünüz her sözcüğün Türkçede var olan gerçek bir sözcük olup olmadığına hızlı ve doğru bir şekilde karar verin.</p>
            <p><strong>Lütfen işaret parmaklarınızı her zaman F ve J tuşlarının üzerinde tutun. "F" tuşu için sol elinizi, "J" tuşu için sağ elinizi kullanın.</strong></p> 
            <p><strong>Eğer sözcük, Türkçede varolan gerçek bir sözcük ise:</strong></p>
            <p><strong>Sağ elinizin işaret parmağını kullanarak “J” tuşuna basın.</strong></p>  
            <p><strong>Eğer sözcük Türkçede var olan gerçek bir sözcük değilse (örneğin, gerçek bir kelimeye benzeyebilir "takıştılar" yerine "takıştıler" gibi):</strong></p>
            <p><strong>Sol elinizin işaret parmağını kullanarak "F" tuşuna basın.</strong></p>

            <p>Çalışmayı lütfen tek oturumda tamamlayın. Yeterli zamanınız yoksa başlamayın.</p>
            <p>Deney boyunca kısa molalar vermeniz için dört ara olacaktır.</p>
            <p>Her sözcükten önce ekranda kısa bir süre "+" işareti görünecektir.</p>
            `,
        choices: ["Continue"]
    };

    var Consent_page = {
        type: jsPsychHtmlButtonResponse,
        stimulus: `
        <p>Informed Consent Form for Adult Participants Earning Money via Online Platforms (IRB-FY2016-747)</p>
        </p>You have been invited to take part in a research study to learn more about language processing in the brain. This study will be conducted by Dr. Alec Marantz, FAS - Psychology, Arts & Science, New York 
        University.</p>
        </p>If you agree to be in this study, you will be asked to do the following:</p>
        </p>Provide basic demographic information about your age, gender, country of birth, country of 
        residence, and linguistic background.</p>
        </p>Complete a linguistic task such as reading sentences or words, naming pictures or describing scenes, watching videos, making up sentences of your own, or participating in a simple language game.<p>
        </p>
        </p>Participation in this study will take between 5 and 35 minutes. Taking part in this study is voluntary. You may refuse to participate or withdraw at any time without penalty.</p>
        </p>There are no known risks associated with your participation in this research beyond those of everyday life. Although you will receive no direct benefits for participation in this study, it may make you more aware of how knowledge is discovered in psychology and help the investigator better understand how people process words, phrases and sentences. </p>
        </p>All data collected will be retained indefinitely, though no identifying information will be collected or retained. All data will be accessible only to Dr. Alec Marantz and his research associates. Information not containing identifiers may be used in future research or shared with other researchers without your additional consent. </p>
        </p>If there is anything about the study or taking part in it that is unclear or that you do not understand, or if you have questions or wish to report a research-related problem, you may contact the principal investigator, Dr. Alec Marantz at (212) 998-3593, marantz@nyu.edu, 10 Washington Place Room 611, New York, NY, 10003.</p>
        </p>Tel: (212) 998-3593 | E-posta: marantz@nyu.edu | Adres: 10 Washington Place, Oda 611, New York, NY, 10003</p>
        </p>For questions about your rights as a research participant, you may contact the University Committee on Activities Involving Human Subjects (UCAIHS), New York University, (212) 998-4808 or ask.humansubjects@nyu.edu, 665 Broadway, Suite 804, New York, NY 10012.</p>
       By clicking continue, you consent to participate."</p>
       `,
        choices: ["Kabul ediyorum"]
    };

    var Practice_Intro_page = {
        type: jsPsychHtmlKeyboardResponse,
        stimulus: `
        <p><strong>Şimdi birkaç uygulama örneği ile başlayacağız.</strong></p>
        <p>Lütfen olabildiğince hızlı ve doğru yanıtlamaya özen gösterin.</p>
        <p><strong>Deneme alıştırmalarına başlamak için herhangi bir tuşa basın.</strong></p>
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
        { stimulus: "teyze", correct_response: "j" },
        { stimulus: "beğenilıyor", correct_response: "f" },
        { stimulus: "uzrak", correct_response: "f" },
        { stimulus: "çarpıntıda", correct_response: "j" },
        { stimulus: "kapıcıye",   correct_response: "f" }
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
          stimulus: function () {
            const last = jsPsych.data.get().last(1).values()[0] || {};
            const resp = (last.response || '').toLowerCase();              // katılımcı tuşu
            const isCorrect = !!last.correct;                               // doğru mu
            const expected = (last.correct_response || '').toLowerCase();   // 'f' ya da 'j'
            const word = last.stimulus || last.stim_text || '';

            if (isCorrect) {
              return `<div style="color:#20ad03;">Doğru yanıt verdiniz!</div>`;
            } else if (!['f','j'].includes(resp)) {
              return `<div style="color:#bf2900;">Yalnızca "F" ya da "J" tuşuna basınız. Lütfen tekrar deneyiniz!</div>`;
            } else if (resp == "j" & expected == "f"){
              return '<div style="color:#bf2900;">Yanlış. Bu kelime gerçek bir Türkçe kelime değil. Lütfen F tuşuna basın.</div>'
            } else if (resp == "f" & expected == "j"){
              return '<div style="color:#bf2900;">Yanlış. Bu kelime gerçek bir Türkçe kelime. Lütfen J tuşuna basın.</div>'
            }},
        choices: "NO_KEYS",
        trial_duration: 1500
        } 

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
        stimulus: `<p><strong>Şimdi deneme yapısına alışmanız için birkaç alıştırma denemesiyle başlayacağız.</strong></p>
        <p>Her kelimeden önce kısa bir “+” işareti göreceksiniz.</p>
        <p><strong>Gerçek kelime: “J”</strong> | <strong>Uydurma kelime: “F”</strong></p>
        <p>Devam etmek için bir tuşa basın.</p>`,
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
                return "<p> Şu ana kadar %" + Math.round((n_correct/n_counter)*100) + " doğru yanıt verdiniz. Kısa bir ara verebilirsiniz! Hazır olduğunuzda herhangi bir tuşa basın. </p>";
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
// Demographics
var demographics = {
  type: jsPsychSurveyHtmlForm,
  preamble: "<h3>Lütfen aşağıdaki bilgileri doldurunuz</h3>",
  html: `
    <p>Cinsiyet:
      <select name="gender" required>
        <option value="" disabled selected>Seçiniz</option>
        <option value="female">Kadın</option>
        <option value="male">Erkek</option>
        <option value="non-binary">İki kategoriden biriyle tanımlanamayan (non-binary)</option>
        <option value="other">Diğer</option>
        <option value="prefer_not_to_say">Belirtmek istemiyorum</option>
      </select>
    </p>

    <p>Yaş: <input name="age" type="number" min="18" step="1" required></p>

    <p>Eğitim durumu:
      <select name="education" required>
        <option value="" disabled selected>Seçiniz</option>
        <option value="elementary_school">İlköğretim</option>
        <option value="high_school">Lise</option>
        <option value="bachelor">Lisans</option>
        <option value="master">Yüksek Lisans</option>
        <option value="phd">Doktora</option>
        <option value="other">Diğer</option>
      </select>
    </p>

    <p>Lütfen bildiğiniz dilleri edinim sırasına göre yazınız
      (ana dilinizi/ana dillerinizi ilk sırada belirtiniz; eşzamanlı iki ana diliniz varsa bunların arasına ‘/’ işareti koyarak yazınız):
      <input name="language_history_ordered" type="text" placeholder="Örn: Türkçe/İngilizce, Almanca">
    </p>

    <p>Günlük hayatta ağırlıklı olarak kullandığınız dili yazınız:
      <input name="dominant_language" type="text" required>
    </p>

    <!-- Aile/ev ortamı -->
    <p>Aile/ev ortamında başka bir dile maruz kaldınız mı?
      <label><input type="radio" name="exp_home_other_langs" value="no"  checked> Hayır</label>
      <label><input type="radio" name="exp_home_other_langs" value="yes"> Evet</label>
    </p>
    <div id="home_years_wrap" style="display:none; margin-left:1rem;">
      Eğer evet ise, yaklaşık kaç yıl bu dile maruz kaldınız?
      <input id="home_years_input" name="exp_home_other_langs_years" type="number" min="0" step="1" disabled>
    </div>

    <!-- Okul/iş ortamı -->
    <p>Okul/iş ortamında başka bir dile maruz kaldınız mı?
      <label><input type="radio" name="exp_school_work_other_langs" value="no"  checked> Hayır</label>
      <label><input type="radio" name="exp_school_work_other_langs" value="yes"> Evet</label>
    </p>
    <div id="school_years_wrap" style="display:none; margin-left:1rem;">
      Eğer evet ise, yaklaşık kaç yıl bu dile maruz kaldınız?
      <input id="school_years_input" name="exp_school_work_other_langs_years" type="number" min="0" step="1" disabled>
    </div>

    <p>Şu anda yaşadığınız ülke:
      <input class="no-autofill-button" name="current_country" type="text"
             autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
             data-lpignore="true" data-1p-ignore="true" data-form-type="other">
    </p>

    <p>Bu ülkede kaç yıldır yaşıyorsunuz?
      <input id="country_years_input" class="no-autofill-button" name="country_years"
             type="number" min="0" step="1" inputmode="numeric" autocomplete="off"
             placeholder="örn: 3" data-1p-ignore="true" data-lpignore="true"
             data-form-type="other" required> yıl
    </p>

    <p>Deney sırasında herhangi bir sorun yaşadınız mı? <textarea name="issues"></textarea></p>
    <p>Başka bir yorumunuz var mı? <textarea name="comments"></textarea></p>
  `,  // ← BU VİRGÜL ŞART
  on_load: () => {
    // radio YES seçilince “yıl” alanlarını aç/kapat
    function bindToggle(groupName, wrapId, inputId){
      const wrap  = document.getElementById(wrapId);
      const input = document.getElementById(inputId);
      // ŞU HATALILARI SİL: \` ... \`
      // DOĞRUSU: template literal ile normal backtick
      const yes = document.querySelector(`input[name="${groupName}"][value="yes"]`);
      const no  = document.querySelector(`input[name="${groupName}"][value="no"]`);
      function apply(){
        const show = !!(yes && yes.checked);
        wrap.style.display = show ? 'block' : 'none';
        input.disabled = !show;
        input.required = show;
        if (!show) input.value = '';
      }
      yes && yes.addEventListener('change', apply);
      no  && no.addEventListener('change', apply);
      apply();
    }
    bindToggle('exp_home_other_langs', 'home_years_wrap', 'home_years_input');
    bindToggle('exp_school_work_other_langs', 'school_years_wrap', 'school_years_input');
  },
  button_label: "Bitir",
  on_finish: (data) => {
    const resp = data.response || {};
    if (resp.prolific_id) {
      jsPsych.data.addProperties({ prolific_id: resp.prolific_id });
    }
  },
  data: { type_of_trial: "survey" }
};

    /* 
    Trial that saves data to osf(datapipe). It will show (in English) "Please wait while data is being saved"

    Comment it out in the timeline below while testing

    Update experiment_id with the experiment id generated for you in datapipe (see readme)
    */
    const save_data = {
        type: jsPsychPipe,
        action: "save",
        experiment_id: "BOV3Bv0IMSzB", // This is 
        filename: filename,
        data_string: ()=>jsPsych.data.get().csv()
    }; 

    /* 
    End screen

    When testing, uncomment the last line to download the csv file locally
    */
    var end = {
        type: jsPsychHtmlButtonResponse,
        stimulus: "<p>Katılımınız için teşekkür ederiz!</p>",
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

  };