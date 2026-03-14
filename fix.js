const fs = require('fs');
let content = fs.readFileSync('/Users/fran/Documents/GitHub/Hermnet/frontend/screens/main/ChatRoomScreen.tsx', 'utf-8');

// Move MsgData type above calculateMessageHeight
const msgDataRegex = /\/\/ ─── Tipos ───+[\s\S]*?type MsgData = \{[\s\S]*?\};\n/;
const match = content.match(msgDataRegex);
if (match) {
    content = content.replace(match[0], '');
    const calculateInsertIndex = content.indexOf('const calculateMessageHeight = ');
    content = content.slice(0, calculateInsertIndex) + match[0] + '\n' + content.slice(calculateInsertIndex);
}

// Ensure the closing bracket of ChatRoomScreen is correct
// the file ends with:
/*
                </View>
            </KeyboardAvoidingView>
        );
    }
*/
// It seems there may be an unmatched brace somewhere. 
// Let's use formatting or just find the missing brace.
fs.writeFileSync('/Users/fran/Documents/GitHub/Hermnet/frontend/screens/main/ChatRoomScreen.tsx', content);
